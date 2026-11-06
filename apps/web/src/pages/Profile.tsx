import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { errFieldErrors, errMessage } from "@/api/axiosClient";
import { updateProfile } from "@/api/authApi";
import { getSchools } from "@/api/listingApi";
import type { School } from "@/types/api";
import { Button } from "@/ui/button";
import { Avatar } from "@/ui/avatar";
import { toast } from "@/ui/toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, route } from "@/constants/routes";
import { parseHobbies } from "@/constants/hobbies";
import { formatPriceShort } from "@/lib/format";
import { PageHeader } from "@/ui/page-header";
import {
  formatVndPreview,
  getCompleteness,
  getInitialForm,
  isFormDirty,
  type ProfileFormState,
} from "./profile/profileTypes";
import { ProfileSection } from "./profile/ProfileSection";
import { ProfileBasicInfoCard } from "./profile/ProfileBasicInfoCard";
import { ProfileAcademicCard } from "./profile/ProfileAcademicCard";
import { ProfileHabitsCard } from "./profile/ProfileHabitsCard";

type SectionKey = "basic" | "academic" | "match";

/** Which section holds a field that the server rejected, so it can be opened. */
function sectionOfField(field: string): SectionKey {
  if (field === "school_id" || field.startsWith("budget_")) return "academic";
  if (["interests", "sleep_schedule", "personality", "cleanliness", "smoking", "looking_for_roommate"].includes(field)) {
    return "match";
  }
  return "basic";
}

export default function Profile() {
  useDocumentTitle("Hồ sơ · TROSV");
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === "student";
  const initialForm = useMemo(() => (user ? getInitialForm(user) : null), [user]);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [openSection, setOpenSection] = useState<SectionKey | null>("basic");

  const [lastUserId, setLastUserId] = useState<number | null>(null);
  if (user && (form === null || lastUserId !== user.id)) {
    setLastUserId(user.id);
    setForm(getInitialForm(user));
  }

  const isDirty = useMemo(
    () => isFormDirty(form, initialForm, isStudent),
    [form, initialForm, isStudent]
  );

  useEffect(() => {
    getSchools().then(setSchools).catch(() => {});
  }, []);

  const formValue = form;

  function set<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]): void {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function toggleSection(key: SectionKey): void {
    setOpenSection((current) => (current === key ? null : key));
  }

  function resetForm(): void {
    if (!initialForm) return;
    setForm({ ...initialForm });
    setFieldErrors({});
    setFormError("");
    toast("Đã khôi phục thông tin ban đầu.");
  }

  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!formValue || !isDirty || busy) return;
    setBusy(true);
    setFieldErrors({});
    setFormError("");

    const payload: Record<string, unknown> = {
      name: formValue.name.trim(),
      phone: formValue.phone.trim() || null,
      bio: formValue.bio.trim() || null,
    };

    if (isStudent) {
      if (formValue.school_id) payload["school_id"] = Number(formValue.school_id);
      payload["budget_min"] = formValue.budget_min ? Number(formValue.budget_min) : null;
      payload["budget_max"] = formValue.budget_max ? Number(formValue.budget_max) : null;
      payload["sleep_schedule"] = formValue.sleep_schedule || null;
      payload["cleanliness"] = formValue.cleanliness ? Number(formValue.cleanliness) : null;
      payload["smoking"] = formValue.smoking;
      payload["personality"] = formValue.personality || null;
      payload["interests"] = formValue.interests.trim() || null;
      payload["looking_for_roommate"] = formValue.looking_for_roommate;
    }

    try {
      await updateProfile(payload);
      await refreshUser();
      toast("Đã lưu hồ sơ.");
    } catch (err) {
      const fe = errFieldErrors(err);
      setFieldErrors(fe);
      const firstBad = Object.keys(fe)[0];
      if (firstBad) setOpenSection(sectionOfField(firstBad));
      setFormError(errMessage(err, "Không lưu được hồ sơ. Bạn thử lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  if (!user || !formValue) return null;

  const minText = formValue.budget_min ? formatVndPreview(formValue.budget_min) : "";
  const maxText = formValue.budget_max ? formatVndPreview(formValue.budget_max) : "";
  const budgetHint =
    minText && maxText
      ? `${minText} – ${maxText} / tháng`
      : minText
      ? `Từ ${minText} / tháng`
      : maxText
      ? `Đến ${maxText} / tháng`
      : "";

  const err = (field: string): string | undefined => fieldErrors[field]?.[0];

  // One-line summaries shown while a section is closed.
  const min = Number(formValue.budget_min);
  const max = Number(formValue.budget_max);
  const budgetSummary =
    min > 0 && max > 0
      ? `${formatPriceShort(min)}–${formatPriceShort(max)}`
      : min > 0
      ? `từ ${formatPriceShort(min)}`
      : max > 0
      ? `đến ${formatPriceShort(max)}`
      : "chưa đặt ngân sách";
  const schoolName = schools.find((s) => String(s.id) === formValue.school_id)?.name;
  const basicSummary = `${formValue.name} · ${formValue.phone || "chưa có số điện thoại"}`;
  const academicSummary = `${schoolName ?? "Chưa chọn trường"} · ${budgetSummary}`;
  const hobbyCount = parseHobbies(formValue.interests).length;
  const matchSummary = `${formValue.looking_for_roommate ? "Bật" : "Tắt"} · ${hobbyCount} sở thích`;

  const { percent, missing } = getCompleteness(formValue, isStudent);

  return (
    <>
      <PageHeader
        className="max-w-2xl"
        leading={<Avatar name={user.name} size={56} />}
        title={user.name}
        description={`${isStudent ? "Sinh viên" : "Chủ nhà"} · ${user.email}`}
        actions={
          isStudent ? (
            <Link
              to={route(ROUTES.STUDENT_PUBLIC, { id: user.id })}
              className="text-sm font-medium text-plate hover:underline"
            >
              Xem trang công khai →
            </Link>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div data-testid="profile-completeness" className="mb-5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">Hồ sơ {percent}%</span>
            {missing.length > 0 ? (
              <span className="truncate text-muted">
                Còn thiếu: {missing.slice(0, 3).join(", ")}
                {missing.length > 3 ? "…" : ""}
              </span>
            ) : (
              <span className="text-moss">Đã đầy đủ</span>
            )}
          </div>
          <div
            role="progressbar"
            aria-label="Mức hoàn thiện hồ sơ"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint"
          >
            <div
              className="h-full rounded-full bg-moss transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <form onSubmit={(e) => { void save(e); }} className="space-y-3">
          {formError ? (
            <p role="alert" className="rounded-xl border border-danger/20 bg-danger-tint p-3 text-sm text-danger">
              {formError}
            </p>
          ) : null}

          <ProfileSection
            id="profile-basic"
            title="Thông tin cơ bản"
            summary={basicSummary}
            open={openSection === "basic"}
            onToggle={() => { toggleSection("basic"); }}
          >
            <ProfileBasicInfoCard
              name={formValue.name}
              phone={formValue.phone}
              bio={formValue.bio}
              onChange={set}
              errors={{ name: err("name"), phone: err("phone"), bio: err("bio") }}
              bioPlaceholder={
                isStudent
                  ? "Ví dụ: Sinh viên năm 2, hòa đồng, thích giữ phòng sạch sẽ..."
                  : "Ví dụ: Chủ nhà thân thiện, phòng trọ an ninh, giờ giấc tự do..."
              }
              bioRows={isStudent ? 4 : 3}
            />
          </ProfileSection>

          {isStudent ? (
            <>
              <ProfileSection
                id="profile-academic"
                title="Học tập & ngân sách"
                summary={academicSummary}
                open={openSection === "academic"}
                onToggle={() => { toggleSection("academic"); }}
              >
                <ProfileAcademicCard
                  schools={schools}
                  schoolId={formValue.school_id}
                  budgetMin={formValue.budget_min}
                  budgetMax={formValue.budget_max}
                  budgetHint={budgetHint}
                  onChange={set}
                  errors={{
                    school_id: err("school_id"),
                    budget_min: err("budget_min"),
                    budget_max: err("budget_max"),
                  }}
                />
              </ProfileSection>

              <ProfileSection
                id="profile-match"
                title="Ghép bạn cùng phòng"
                summary={matchSummary}
                open={openSection === "match"}
                onToggle={() => { toggleSection("match"); }}
              >
                <ProfileHabitsCard
                  lookingForRoommate={formValue.looking_for_roommate}
                  sleepSchedule={formValue.sleep_schedule}
                  personality={formValue.personality}
                  cleanliness={formValue.cleanliness}
                  smoking={formValue.smoking}
                  interests={formValue.interests}
                  onChange={set}
                  errors={{ interests: err("interests") }}
                />
              </ProfileSection>
            </>
          ) : null}

          {isDirty || busy ? (
            <div
              data-testid="profile-save-bar"
              className="sticky bottom-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card/95 p-3 shadow-pop backdrop-blur-xs lg:bottom-4"
            >
              <p className="text-sm font-medium text-ink">Có thay đổi chưa lưu</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={resetForm} disabled={busy}>
                  Khôi phục
                </Button>
                <Button
                  id="profile-submit-btn"
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={busy}
                  disabled={!isDirty || busy}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </>
  );
}
