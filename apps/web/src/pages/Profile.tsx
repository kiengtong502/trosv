import { Link } from "react-router-dom";
import { useSchools } from "@/hooks/useReferenceData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, route } from "@/constants/routes";
import { PageHeader } from "@/ui/page-header";
import { budgetHint, getCompleteness, sectionSummaries } from "./profile/profileTypes";
import { ProfileSection } from "./profile/ProfileSection";
import { ProfileBasicInfoCard } from "./profile/ProfileBasicInfoCard";
import { ProfileAcademicCard } from "./profile/ProfileAcademicCard";
import { ProfileHabitsCard } from "./profile/ProfileHabitsCard";
import { ProfileCompleteness } from "./profile/ProfileCompleteness";
import { ProfileSaveBar } from "./profile/ProfileSaveBar";
import { AvatarPicker } from "./profile/AvatarPicker";
import { useProfileForm } from "./profile/useProfileForm";

export default function Profile() {
  useDocumentTitle("Hồ sơ · TROSV");
  const { data: schools } = useSchools();
  const p = useProfileForm();
  const { user, form, isStudent } = p;
  if (!user || !form) return null;

  const err = p.fieldError;
  const summaries = sectionSummaries(form, schools);
  const { percent, missing } = getCompleteness(form, isStudent);

  return (
    <>
      <PageHeader
        className="max-w-2xl"
        leading={<AvatarPicker name={user.name} avatar={user.avatar} onSaved={p.refreshUser} />}
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
        <ProfileCompleteness percent={percent} missing={missing} />

        <form
          onSubmit={(e) => {
            void p.save(e);
          }}
          className="space-y-3"
        >
          {p.formError ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/20 bg-danger-tint p-3 text-sm text-danger"
            >
              {p.formError}
            </p>
          ) : null}

          <ProfileSection
            id="profile-basic"
            title="Thông tin cơ bản"
            summary={summaries.basic}
            open={p.openSection === "basic"}
            onToggle={() => {
              p.toggleSection("basic");
            }}
          >
            <ProfileBasicInfoCard
              name={form.name}
              phone={form.phone}
              bio={form.bio}
              onChange={p.set}
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
                summary={summaries.academic}
                open={p.openSection === "academic"}
                onToggle={() => {
                  p.toggleSection("academic");
                }}
              >
                <ProfileAcademicCard
                  schools={schools}
                  schoolId={form.school_id}
                  budgetMin={form.budget_min}
                  budgetMax={form.budget_max}
                  budgetHint={budgetHint(form.budget_min, form.budget_max)}
                  onChange={p.set}
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
                summary={summaries.match}
                open={p.openSection === "match"}
                onToggle={() => {
                  p.toggleSection("match");
                }}
              >
                <ProfileHabitsCard
                  lookingForRoommate={form.looking_for_roommate}
                  sleepSchedule={form.sleep_schedule}
                  personality={form.personality}
                  cleanliness={form.cleanliness}
                  smoking={form.smoking}
                  interests={form.interests}
                  onChange={p.set}
                  errors={{ interests: err("interests") }}
                />
              </ProfileSection>
            </>
          ) : null}

          {p.isDirty || p.busy ? (
            <ProfileSaveBar busy={p.busy} dirty={p.isDirty} onReset={p.reset} />
          ) : null}
        </form>
      </div>
    </>
  );
}
