/**
 * For fire-and-forget calls where a failure must not break the UI (marking a
 * conversation read, refreshing a badge...). It is deliberate and visible: the
 * failure is logged with a name, never silently swallowed.
 *
 *   markRead(id).catch(ignoreError("markRead"));
 */
export function ignoreError(context: string): (error: unknown) => void {
  return (error) => {
    console.warn(`[ignored] ${context} failed`, error);
  };
}
