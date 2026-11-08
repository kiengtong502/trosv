import { parseHobbies } from "@/constants/hobbies";
import { formatVnd } from "@/lib/format";
import type { School, User } from "@/types/api";

export const SLEEP_OPTIONS = [
  { value: "early", label: "Ngủ sớm", sub: "Trước 23:00" },
  { value: "normal", label: "Bình thường", sub: "23:00 – 00:00" },
  { value: "late", label: "Cú đêm", sub: "Sau 00:00" },
] as const;

export const PERSONALITY_OPTIONS = [
  { value: "introvert", label: "Hướng nội", sub: "Yên tĩnh" },
  { value: "ambivert", label: "Trung tính", sub: "Cân bằng" },
  { value: "extrovert", label: "Hướng ngoại", sub: "Hòa đồng" },
] as const;

export const CLEANLINESS_LEVELS = [
  { level: 1, label: "Thoải mái" },
  { level: 2, label: "Vừa phải" },
  { level: 3, label: "Tiêu chuẩn" },
  { level: 4, label: "Gọn gàng" },
  { level: 5, label: "Rất kỹ tính" },
] as const;

export interface ProfileFormState {
  name: string;
  phone: string;
  bio: string;
  school_id: string;
  budget_min: string;
  budget_max: string;
  sleep_schedule: string;
  cleanliness: string;
  smoking: boolean;
  personality: string;
  interests: string;
  looking_for_roommate: boolean;
}

export function getInitialForm(user: User): ProfileFormState {
  return {
    name: user.name,
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    school_id: user.school_id != null ? String(user.school_id) : "",
    budget_min: user.budget_min != null ? String(user.budget_min) : "",
    budget_max: user.budget_max != null ? String(user.budget_max) : "",
    sleep_schedule: user.sleep_schedule ?? "",
    cleanliness: user.cleanliness != null ? String(user.cleanliness) : "",
    smoking: user.smoking === true,
    personality: user.personality ?? "",
    interests: user.interests ?? "",
    looking_for_roommate: user.looking_for_roommate === true,
  };
}

export function isFormDirty(
  current: ProfileFormState | null,
  initial: ProfileFormState | null,
  isStudent: boolean,
): boolean {
  if (!current || !initial) return false;

  if (current.name.trim() !== initial.name.trim()) return true;
  if (current.phone.trim() !== initial.phone.trim()) return true;
  if (current.bio.trim() !== initial.bio.trim()) return true;

  if (isStudent) {
    if (current.school_id !== initial.school_id) return true;
    if (current.budget_min !== initial.budget_min) return true;
    if (current.budget_max !== initial.budget_max) return true;
    if (current.sleep_schedule !== initial.sleep_schedule) return true;
    if (current.cleanliness !== initial.cleanliness) return true;
    if (current.smoking !== initial.smoking) return true;
    if (current.personality !== initial.personality) return true;
    if (current.interests.trim() !== initial.interests.trim()) return true;
    if (current.looking_for_roommate !== initial.looking_for_roommate) return true;
  }

  return false;
}

/**
 * How complete the profile is, and what is still missing (in display order).
 * Students are checked on 9 items, landlords on 3.
 */
export function getCompleteness(
  form: ProfileFormState,
  isStudent: boolean,
): { percent: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ["Tên", form.name.trim() !== ""],
    ["Số điện thoại", form.phone.trim() !== ""],
    ["Giới thiệu bản thân", form.bio.trim() !== ""],
  ];
  if (isStudent) {
    const hobbyCount = form.interests.split(",").filter((s) => s.trim() !== "").length;
    checks.push(
      ["Trường", form.school_id !== ""],
      ["Ngân sách", form.budget_min !== "" && form.budget_max !== ""],
      ["Giờ giấc ngủ", form.sleep_schedule !== ""],
      ["Tính cách", form.personality !== ""],
      ["Độ sạch sẽ", form.cleanliness !== ""],
      ["Ít nhất 3 sở thích", hobbyCount >= 3],
    );
  }
  const done = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

export function formatVndPreview(val: string): string {
  if (!val) return "";
  const n = parseInt(val.replace(/\D/g, ""), 10);
  if (isNaN(n) || n <= 0) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export type SectionKey = "basic" | "academic" | "match";

const MATCH_FIELDS = [
  "interests",
  "sleep_schedule",
  "personality",
  "cleanliness",
  "smoking",
  "looking_for_roommate",
];

/** Which section holds a field that the server rejected, so it can be opened. */
export function sectionOfField(field: string): SectionKey {
  if (field === "school_id" || field.startsWith("budget_")) return "academic";
  return MATCH_FIELDS.includes(field) ? "match" : "basic";
}

/** The body for PATCH /profile: trimmed text, empty values as null, student-only fields only for students. */
export function buildProfilePayload(
  form: ProfileFormState,
  isStudent: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    bio: form.bio.trim() || null,
  };
  if (!isStudent) return payload;

  if (form.school_id) payload["school_id"] = Number(form.school_id);
  payload["budget_min"] = form.budget_min ? Number(form.budget_min) : null;
  payload["budget_max"] = form.budget_max ? Number(form.budget_max) : null;
  payload["sleep_schedule"] = form.sleep_schedule || null;
  payload["cleanliness"] = form.cleanliness ? Number(form.cleanliness) : null;
  payload["smoking"] = form.smoking;
  payload["personality"] = form.personality || null;
  payload["interests"] = form.interests.trim() || null;
  payload["looking_for_roommate"] = form.looking_for_roommate;
  return payload;
}

/** "1.500.000đ – 3.000.000đ / tháng" for the budget field's hint; empty when no budget is set. */
export function budgetHint(min: string, max: string): string {
  const from = min ? formatVndPreview(min) : "";
  const to = max ? formatVndPreview(max) : "";
  if (from && to) return `${from} – ${to} / tháng`;
  if (from) return `Từ ${from} / tháng`;
  if (to) return `Đến ${to} / tháng`;
  return "";
}

function budgetSummary(min: string, max: string): string {
  const lo = Number(min);
  const hi = Number(max);
  if (lo > 0 && hi > 0) return `${formatVnd(lo)}–${formatVnd(hi)}`;
  if (lo > 0) return `từ ${formatVnd(lo)}`;
  if (hi > 0) return `đến ${formatVnd(hi)}`;
  return "chưa đặt ngân sách";
}

/** The one-line summaries shown while a section is collapsed. */
export function sectionSummaries(
  form: ProfileFormState,
  schools: readonly School[],
): Record<SectionKey, string> {
  const schoolName = schools.find((s) => String(s.id) === form.school_id)?.name;
  return {
    basic: `${form.name} · ${form.phone || "chưa có số điện thoại"}`,
    academic: `${schoolName ?? "Chưa chọn trường"} · ${budgetSummary(form.budget_min, form.budget_max)}`,
    match: `${form.looking_for_roommate ? "Bật" : "Tắt"} · ${String(parseHobbies(form.interests).length)} sở thích`,
  };
}
