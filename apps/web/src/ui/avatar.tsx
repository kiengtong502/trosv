import * as React from "react";
import { cn } from "@/lib/utils";
import { AVATAR_NAMES, AVATAR_SVG, isAvatarKey } from "./avatar-art";

/*
  Avatars: a hand-drawn critter picked by the user (see avatar-art.ts). When
  no key is known yet (older payloads), it falls back to initials on a tint
  derived from the name, so a person always looks the same across screens.
*/

const TINTS = [
  "bg-plate-tint text-plate",
  "bg-moss-tint text-moss",
  "bg-flyer/40 text-ink",
  "bg-sunken text-ink",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] !== undefined ? parts[0][0] ?? "" : "";
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? "")[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length] ?? TINTS[0];
}

export interface AvatarProps extends React.ComponentProps<"span"> {
  name: string;
  /** Avatar key from the API (one of AVATAR_KEYS). */
  avatar?: string | null | undefined;
  size?: number;
}

export function Avatar({ name, avatar, size = 40, className, ...props }: AvatarProps) {
  if (isAvatarKey(avatar)) {
    return (
      <span
        className={cn("inline-flex select-none overflow-hidden rounded-full [&>svg]:size-full", className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={name}
        title={name}
        data-avatar={avatar}
        data-avatar-name={AVATAR_NAMES[avatar]}
        // Static, trusted markup from avatar-art.ts (no user input).
        dangerouslySetInnerHTML={{ __html: AVATAR_SVG[avatar] }}
        {...props}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex select-none items-center justify-center overflow-hidden rounded-full font-medium",
        tintFor(name),
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      role="img"
      aria-label={name}
      title={name}
      {...props}
    >
      {initials(name)}
    </span>
  );
}
