import { expect, it } from "vitest";
import type { Message } from "@/shared/types/api";
import { mergeMessages } from "./mergeMessages";

it("keeps realtime edits, deduplicates and sorts messages delivered out of order", () => {
  const current = [
    { id: 3, body: "Newest" },
    { id: 1, body: null, is_unsent: true },
  ] as Message[];
  const incoming = [
    { id: 1, body: "Old snapshot" },
    { id: 2, body: "Middle" },
  ] as Message[];
  expect(mergeMessages(current, incoming)).toEqual([current[1], incoming[1], current[0]]);
});
