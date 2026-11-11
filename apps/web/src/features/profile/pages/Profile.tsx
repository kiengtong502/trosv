import { useSchools } from "@/features/listings/hooks/useReferenceData";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { budgetHint, getCompleteness, sectionSummaries } from "../lib/profileTypes";
import { ProfileSection } from "../components/ProfileSection";
import { ProfileBasicInfoCard } from "../components/ProfileBasicInfoCard";
import { ProfileAcademicCard } from "../components/ProfileAcademicCard";
import { ProfileHabitsCard } from "../components/ProfileHabitsCard";
import { ProfileCompleteness } from "../components/ProfileCompleteness";
import { ProfileSaveBar } from "../components/ProfileSaveBar";
import { ProfileHeader } from "../components/ProfileHeader";
import { useProfileForm } from "../hooks/useProfileForm";

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
      <ProfileHeader user={user} onAvatarSaved={p.refreshUser} />

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
