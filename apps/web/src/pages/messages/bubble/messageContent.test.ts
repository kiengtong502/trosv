import { describe, expect, it } from "vitest";
import {
  describeMessage,
  formatMessageTimes,
  isImageAttachment,
  parseMessageBody,
  pickBadgeTarget,
  resolveAttachmentUrl,
  splitLinks,
} from "./messageContent";

describe("resolveAttachmentUrl", () => {
  it.each([null, undefined, ""])("is null for %j", (value) => {
    expect(resolveAttachmentUrl(value)).toBeNull();
  });

  it("turns an absolute url into a path on the current origin", () => {
    expect(resolveAttachmentUrl("http://localhost:8000/attachments/9/file.png?sig=abc")).toBe(
      "/attachments/9/file.png?sig=abc",
    );
    expect(resolveAttachmentUrl("https://trosv.vn/attachments/1")).toBe("/attachments/1");
  });

  it("leaves a relative path alone", () => {
    expect(resolveAttachmentUrl("/attachments/5/a.pdf")).toBe("/attachments/5/a.pdf");
  });
});

describe("isImageAttachment", () => {
  it("trusts an image/* mime type", () => {
    expect(isImageAttachment(null, null, "image/png")).toBe(true);
  });

  it.each(["photo.JPG", "a.jpeg", "b.png", "c.webp", "d.gif", "e.svg", "f.avif"])(
    "recognises the file name %s",
    (name) => {
      expect(isImageAttachment(name)).toBe(true);
    },
  );

  it("recognises an image url, including a query string", () => {
    expect(isImageAttachment(null, "/attachments/1/x.png?sig=1")).toBe(true);
  });

  it.each(["report.pdf", "notes.docx", "png", "archive.png.zip"])("rejects %s", (name) => {
    expect(isImageAttachment(name, null, "application/pdf")).toBe(false);
  });

  it("is false with no information", () => {
    expect(isImageAttachment()).toBe(false);
  });
});

describe("parseMessageBody", () => {
  it.each([null, undefined, ""])("has no room and empty text for %j", (value) => {
    expect(parseMessageBody(value)).toEqual({ roomId: null, text: "" });
  });

  it("keeps plain text untouched", () => {
    expect(parseMessageBody("  Phòng còn trống không ạ? ")).toEqual({
      roomId: null,
      text: "  Phòng còn trống không ạ? ",
    });
  });

  it("extracts a room id from a bare path and strips the link", () => {
    expect(parseMessageBody("Xem phòng này /rooms/42")).toEqual({
      roomId: 42,
      text: "Xem phòng này",
    });
  });

  it("extracts a room id from a full url", () => {
    expect(parseMessageBody("http://localhost:5173/rooms/7")).toEqual({ roomId: 7, text: "" });
  });

  it("rewrites the auto-generated intro so it reads naturally next to the card", () => {
    const body = "Chào bạn, mình quan tâm đến phòng trọ: Phòng gác lửng http://x.test/rooms/12";
    const { roomId, text } = parseMessageBody(body);
    expect(roomId).toBe(12);
    expect(text).toBe("Chào bạn, mình quan tâm đến phòng trọ này:");
  });

  it("does not treat /rooms/0 as a room", () => {
    expect(parseMessageBody("/rooms/0")).toEqual({ roomId: null, text: "/rooms/0" });
  });

  it("ignores /rooms without an id", () => {
    expect(parseMessageBody("vào /rooms nhé").roomId).toBeNull();
  });
});

describe("pickBadgeTarget", () => {
  it.each([
    [{ roomPreview: true, text: true, attachment: true }, "room"],
    [{ roomPreview: false, text: true, attachment: true }, "text"],
    [{ roomPreview: false, text: false, attachment: true }, "attachment"],
    [{ roomPreview: false, text: false, attachment: false }, null],
  ] as const)("%j -> %s (the bottom-most element wins)", (has, expected) => {
    expect(pickBadgeTarget(has)).toBe(expected);
  });
});

describe("formatMessageTimes", () => {
  it.each([null, undefined, ""])("is empty for %j", (value) => {
    expect(formatMessageTimes(value)).toEqual({ time: "", full: "" });
  });

  it("gives a short time and a full time with the date", () => {
    const { time, full } = formatMessageTimes("2026-03-05T08:09:00");
    expect(time).toMatch(/08:09/);
    expect(full.startsWith(time)).toBe(true);
    expect(full).toContain("05/03/2026");
  });
});

describe("splitLinks", () => {
  it("returns one entry when there is no link", () => {
    expect(splitLinks("xin chào")).toEqual(["xin chào"]);
  });

  it("puts links at the odd positions", () => {
    expect(splitLinks("a https://x.test/p b /rooms/3 c")).toEqual([
      "a ",
      "https://x.test/p",
      " b ",
      "/rooms/3",
      " c",
    ]);
  });

  it("handles adjacent links separated by a space", () => {
    const parts = splitLinks("https://a.test https://b.test");
    expect(parts.filter((_, i) => i % 2 === 1)).toEqual(["https://a.test", "https://b.test"]);
  });
});

describe("describeMessage", () => {
  const base = { body: "Xin chào", created_at: "2026-03-05T08:09:00" };

  it("derives the text, no room and no attachment for a plain message", () => {
    const view = describeMessage(base, 1);
    expect(view).toMatchObject({
      text: "Xin chào",
      roomId: null,
      attachmentUrl: null,
      badgeTarget: "text",
    });
    expect(view.reactions).toEqual([]);
  });

  it("finds the viewer's own reaction among everyone's", () => {
    const view = describeMessage({ ...base, reactions: { "1": "👍", "2": "❤️" } }, 2);
    expect(view.reactions).toEqual(["👍", "❤️"]);
    expect(view.myReaction).toBe("❤️");
  });

  it("has no own reaction for an anonymous viewer", () => {
    expect(
      describeMessage({ ...base, reactions: { "1": "👍" } }, undefined).myReaction,
    ).toBeUndefined();
  });

  it("hangs the badge on the room card when one is shared", () => {
    const view = describeMessage(
      { body: "Xem /rooms/9", attachment_url: "/attachments/1/a.png" },
      1,
    );
    expect(view).toMatchObject({
      roomId: 9,
      text: "Xem",
      attachmentUrl: "/attachments/1/a.png",
      badgeTarget: "room",
    });
  });

  it("hangs the badge on the attachment when there is no text or room", () => {
    const view = describeMessage(
      { body: "", attachment_url: "http://x.test/attachments/2/b.pdf" },
      1,
    );
    expect(view).toMatchObject({
      attachmentUrl: "/attachments/2/b.pdf",
      badgeTarget: "attachment",
    });
  });

  it("has no badge target for an empty message", () => {
    expect(describeMessage({ body: "" }, 1).badgeTarget).toBeNull();
  });
});
