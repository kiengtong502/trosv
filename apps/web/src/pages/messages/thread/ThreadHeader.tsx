import { ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES, route } from "@/constants/routes";
import { Avatar } from "@/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/api";

type OtherUser = Conversation["other_user"];

const ROLE_LABEL: Record<string, string> = { student: "Sinh viên", landlord: "Chủ nhà" };

/** Who you are talking to and their role; students link to their public profile. */
export function ThreadHeader({ otherUser }: { otherUser: OtherUser }) {
  const navigate = useNavigate();
  const name = otherUser?.name ?? "Người dùng";
  const role = otherUser?.role ?? "";
  const roleLabel = ROLE_LABEL[role] ?? null;
  const avatar = <Avatar name={name} avatar={otherUser?.avatar} size={42} />;

  return (
    <div
      data-testid="thread-header"
      className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line bg-card px-3 sm:px-4"
    >
      <button
        type="button"
        onClick={() => {
          void navigate(ROUTES.MESSAGES);
        }}
        className="-ml-1 flex size-10 items-center justify-center rounded-lg text-ink-2 hover:bg-tint md:hidden"
        aria-label="Về danh sách tin nhắn"
      >
        <ChevronDown className="size-5 rotate-90" aria-hidden />
      </button>
      {otherUser && role === "student" ? (
        <Link
          to={route(ROUTES.STUDENT_PUBLIC, { id: otherUser.id })}
          className="flex items-center gap-2 hover:opacity-80"
        >
          {avatar}
        </Link>
      ) : (
        avatar
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className="truncate font-display text-base font-bold text-ink">{name}</p>
        {roleLabel ? (
          <span
            data-testid="role-chip"
            className={cn(
              "flex-none rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
              role === "landlord" ? "bg-moss-tint text-moss" : "bg-plate-tint text-plate",
            )}
          >
            {roleLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
