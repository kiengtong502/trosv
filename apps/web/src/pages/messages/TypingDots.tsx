/* "The other person is typing": three dots in a card bubble, bouncing in turn. */
export function TypingDots() {
  return (
    <div
      role="status"
      className="mt-1.5 flex w-fit items-center gap-1 self-start rounded-2xl rounded-bl-md border border-line bg-card px-3.5 py-3.5 shadow-card"
    >
      <span className="sr-only">Đang soạn…</span>
      <i aria-hidden className="typing-dot" />
      <i aria-hidden className="typing-dot" />
      <i aria-hidden className="typing-dot" />
    </div>
  );
}
