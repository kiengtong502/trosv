import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { updateProfile } from "@/features/auth/api/authApi";
import { errFieldErrors, errMessage } from "@/shared/api/axiosClient";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "@/shared/ui/toast";
import {
  buildProfilePayload,
  getInitialForm,
  isFormDirty,
  sectionOfField,
  type ProfileFormState,
  type SectionKey,
} from "../lib/profileTypes";

/** Editing state for the profile page: form values, dirty check, save, reset, server errors. */
export function useProfileForm() {
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === "student";
  const initialForm = useMemo(() => (user ? getInitialForm(user) : null), [user]);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [openSection, setOpenSection] = useState<SectionKey | null>("basic");

  // Start (or restart, after a different user logs in) from the user's saved values.
  const [lastUserId, setLastUserId] = useState<number | null>(null);
  if (user && (form === null || lastUserId !== user.id)) {
    setLastUserId(user.id);
    setForm(getInitialForm(user));
  }

  const isDirty = useMemo(
    () => isFormDirty(form, initialForm, isStudent),
    [form, initialForm, isStudent],
  );

  function set<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]): void {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function toggleSection(key: SectionKey): void {
    setOpenSection((current) => (current === key ? null : key));
  }

  function reset(): void {
    if (!initialForm) return;
    setForm({ ...initialForm });
    setFieldErrors({});
    setFormError("");
    toast("Đã khôi phục thông tin ban đầu.");
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!form || !isDirty || busy) return;
    setBusy(true);
    setFieldErrors({});
    setFormError("");
    try {
      await updateProfile(buildProfilePayload(form, isStudent));
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

  return {
    user,
    refreshUser,
    isStudent,
    form,
    set,
    isDirty,
    busy,
    formError,
    /** First server error for a field, if any. */
    fieldError: (field: string): string | undefined => fieldErrors[field]?.[0],
    openSection,
    toggleSection,
    reset,
    save,
  };
}
