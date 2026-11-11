import { Link } from "react-router-dom";
import { ROUTES, route } from "@/shared/constants/routes";
import { PageHeader } from "@/shared/ui/page-header";
import type { User } from "@/shared/types/api";
import { AvatarPicker } from "./AvatarPicker";

/** Avatar, name, role and email; students also get a link to their public page. */
export function ProfileHeader({
  user,
  onAvatarSaved,
}: {
  user: User;
  onAvatarSaved: () => Promise<unknown>;
}) {
  const isStudent = user.role === "student";
  return (
    <PageHeader
      className="max-w-2xl"
      leading={<AvatarPicker name={user.name} avatar={user.avatar} onSaved={onAvatarSaved} />}
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
  );
}
