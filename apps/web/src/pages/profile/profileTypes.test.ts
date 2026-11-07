import { describe, expect, it } from "vitest";
import type { User } from "@/types/api";
import {
  type ProfileFormState,
  formatVndPreview,
  getCompleteness,
  getInitialForm,
  isFormDirty,
} from "./profileTypes";

const EMPTY: ProfileFormState = {
  name: "",
  phone: "",
  bio: "",
  school_id: "",
  budget_min: "",
  budget_max: "",
  sleep_schedule: "",
  cleanliness: "",
  smoking: false,
  personality: "",
  interests: "",
  looking_for_roommate: false,
};

const FULL: ProfileFormState = {
  name: "An",
  phone: "0900000000",
  bio: "Xin chào",
  school_id: "3",
  budget_min: "1500000",
  budget_max: "3000000",
  sleep_schedule: "early",
  cleanliness: "4",
  smoking: false,
  personality: "introvert",
  interests: "gym,music,coding",
  looking_for_roommate: true,
};

const user = (over: Partial<User> = {}): User => ({
  id: 1,
  name: "An",
  email: "an@example.com",
  role: "student",
  ...over,
});

describe("getInitialForm", () => {
  it("turns missing optional fields into empty strings and false", () => {
    expect(getInitialForm(user())).toEqual({ ...EMPTY, name: "An" });
  });

  it("stringifies numeric ids, budgets and cleanliness", () => {
    const form = getInitialForm(
      user({ school_id: 7, budget_min: 1_000_000, budget_max: 2_000_000, cleanliness: 3 }),
    );
    expect(form.school_id).toBe("7");
    expect(form.budget_min).toBe("1000000");
    expect(form.budget_max).toBe("2000000");
    expect(form.cleanliness).toBe("3");
  });

  it("keeps a zero budget as '0' (not treated as missing)", () => {
    expect(getInitialForm(user({ budget_min: 0 })).budget_min).toBe("0");
  });

  it("only treats literal true as true for the boolean flags", () => {
    const form = getInitialForm(user({ smoking: true, looking_for_roommate: true }));
    expect(form.smoking).toBe(true);
    expect(form.looking_for_roommate).toBe(true);
    expect(getInitialForm(user({ smoking: false })).smoking).toBe(false);
  });
});

describe("isFormDirty", () => {
  it("is false when either side is missing", () => {
    expect(isFormDirty(null, FULL, true)).toBe(false);
    expect(isFormDirty(FULL, null, true)).toBe(false);
  });

  it("is false for identical forms", () => {
    expect(isFormDirty(FULL, { ...FULL }, true)).toBe(false);
  });

  it("ignores surrounding whitespace in text fields", () => {
    expect(isFormDirty({ ...FULL, name: "  An  ", bio: "Xin chào " }, FULL, true)).toBe(false);
  });

  it.each(["name", "phone", "bio"] as const)("notices a change in %s for everyone", (field) => {
    expect(isFormDirty({ ...FULL, [field]: "khác" }, FULL, false)).toBe(true);
  });

  it.each([
    ["school_id", "9"],
    ["budget_min", "1"],
    ["budget_max", "9"],
    ["sleep_schedule", "late"],
    ["cleanliness", "1"],
    ["smoking", true],
    ["personality", "extrovert"],
    ["interests", "gym"],
    ["looking_for_roommate", false],
  ] as const)("notices a student-only change in %s", (field, value) => {
    expect(isFormDirty({ ...FULL, [field]: value }, FULL, true)).toBe(true);
  });

  it("ignores student-only fields for landlords", () => {
    expect(
      isFormDirty({ ...FULL, school_id: "9", smoking: true, interests: "x" }, FULL, false),
    ).toBe(false);
  });
});

describe("getCompleteness", () => {
  it("is 0% with every student item missing", () => {
    const result = getCompleteness(EMPTY, true);
    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(9);
  });

  it("is 100% for a full student profile", () => {
    expect(getCompleteness(FULL, true)).toEqual({ percent: 100, missing: [] });
  });

  it("only checks 3 items for a landlord", () => {
    expect(getCompleteness(EMPTY, false).missing).toEqual([
      "Tên",
      "Số điện thoại",
      "Giới thiệu bản thân",
    ]);
    expect(getCompleteness({ ...EMPTY, name: "A" }, false).percent).toBe(33);
  });

  it("needs both budget ends", () => {
    expect(getCompleteness({ ...FULL, budget_max: "" }, true).missing).toEqual(["Ngân sách"]);
  });

  it("needs at least 3 hobbies, ignoring blanks", () => {
    expect(getCompleteness({ ...FULL, interests: "gym,music,," }, true).missing).toEqual([
      "Ít nhất 3 sở thích",
    ]);
    expect(getCompleteness({ ...FULL, interests: "gym,music,coding" }, true).missing).toEqual([]);
  });

  it("treats whitespace-only text as empty", () => {
    expect(getCompleteness({ ...FULL, name: "   " }, true).missing).toEqual(["Tên"]);
  });
});

describe("formatVndPreview", () => {
  it.each(["", "abc", "0"])("is empty for %j", (value) => {
    expect(formatVndPreview(value)).toBe("");
  });

  it("formats a positive amount as VND", () => {
    expect(formatVndPreview("2500000").replace(/\s/g, " ")).toMatch(/2\.500\.000/);
  });

  it("strips a minus sign: budgets are digits only, so '-5' previews as 5", () => {
    expect(formatVndPreview("-5")).toBe(formatVndPreview("5"));
  });

  it("ignores non-digits typed into the field", () => {
    expect(formatVndPreview("1.500.000 đ")).toBe(formatVndPreview("1500000"));
  });
});
