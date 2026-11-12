import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/shared/constants/routes";
import { FormValidationError, useAuthForm } from "./useAuthForm";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

function submitEvent() {
  const preventDefault = vi.fn();
  return { event: { preventDefault } as unknown as FormEvent, preventDefault };
}

beforeEach(() => {
  navigate.mockReset();
});

describe("useAuthForm", () => {
  it("prevents the browser's own form submit", async () => {
    const { result } = renderHook(() => useAuthForm({ submit: () => Promise.resolve() }));
    const { event, preventDefault } = submitEvent();
    await act(async () => {
      await result.current.handleSubmit(event);
    });
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("goes home (replacing history) after a successful submit", async () => {
    const { result } = renderHook(() => useAuthForm({ submit: () => Promise.resolve() }));
    await act(async () => {
      await result.current.handleSubmit(submitEvent().event);
    });
    expect(navigate).toHaveBeenCalledWith(ROUTES.HOME, { replace: true });
  });

  it("afterSuccess replaces the default navigation", async () => {
    const afterSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAuthForm({ submit: () => Promise.resolve(), afterSuccess }),
    );
    await act(async () => {
      await result.current.handleSubmit(submitEvent().event);
    });
    expect(afterSuccess).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("reports the error, does not navigate, and re-enables the form", async () => {
    const failure = new Error("nope");
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAuthForm({ submit: () => Promise.reject(failure), onError }),
    );
    await act(async () => {
      await result.current.handleSubmit(submitEvent().event);
    });
    expect(onError).toHaveBeenCalledWith(failure);
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);
  });

  it("a client-side validation stop is not reported to onError (it would overwrite the field errors)", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAuthForm({ submit: () => Promise.reject(new FormValidationError()), onError }),
    );
    await act(async () => {
      await result.current.handleSubmit(submitEvent().event);
    });
    expect(onError).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);
  });

  it("a failure without an onError handler does not throw", async () => {
    const { result } = renderHook(() =>
      useAuthForm({ submit: () => Promise.reject(new Error("x")) }),
    );
    await act(async () => {
      await expect(result.current.handleSubmit(submitEvent().event)).resolves.toBeUndefined();
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("is busy for exactly as long as the submit is pending", async () => {
    let finish: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const { result } = renderHook(() => useAuthForm({ submit: () => pending }));
    expect(result.current.busy).toBe(false);

    let done: Promise<void> | undefined;
    act(() => {
      done = result.current.handleSubmit(submitEvent().event);
    });
    expect(result.current.busy).toBe(true);

    await act(async () => {
      finish();
      await done;
    });
    expect(result.current.busy).toBe(false);
  });
});
