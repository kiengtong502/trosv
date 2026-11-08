import { describe, expect, it } from "vitest";
import type { Conversation } from "@/types/api";
import { describeConversation } from "./conversationRow";

const conv = (over: Partial<Conversation> = {}): Conversation =>
  ({ id: 1, student_id: 1, landlord_id: 2, ...over });

describe("describeConversation", () => {
  it("falls back to 'Người dùng', no unread and an empty preview", () => {
    expect(describeConversation(conv(), 1)).toEqual({
      name: "Người dùng",
      unread: 0,
      preview: "",
      lastAt: null,
    });
  });

  it("uses the other person's name and the unread count", () => {
    const view = describeConversation(
      conv({ other_user: { id: 2, name: "Anh Chủ" }, unread_count: 3 }),
      1,
    );
    expect(view).toMatchObject({ name: "Anh Chủ", unread: 3 });
  });

  it("prefixes your own last message with 'Bạn: '", () => {
    const c = conv({
      last_message: { sender_id: 1, body: "Dạ vâng", created_at: "2026-11-07T10:00:00Z" },
    });
    expect(describeConversation(c, 1).preview).toBe("Bạn: Dạ vâng");
  });

  it("does not prefix the other person's message", () => {
    const c = conv({
      last_message: { sender_id: 2, body: "Phòng còn trống", created_at: "2026-11-07T10:00:00Z" },
    });
    expect(describeConversation(c, 1).preview).toBe("Phòng còn trống");
  });

  it("never claims a message is yours when the viewer is unknown", () => {
    const c = conv({
      last_message: { sender_id: 1, body: "Xin chào", created_at: "2026-11-07T10:00:00Z" },
    });
    expect(describeConversation(c, undefined).preview).toBe("Xin chào");
  });

  it("passes the last message time through", () => {
    const c = conv({
      last_message: { sender_id: 2, body: "x", created_at: "2026-11-07T10:00:00Z" },
    });
    expect(describeConversation(c, 1).lastAt).toBe("2026-11-07T10:00:00Z");
  });
});
