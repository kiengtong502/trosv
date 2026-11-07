import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { envelope, envelopeArray, pagedEnvelope } from "./envelope";

const res = (data: unknown): AxiosResponse => ({ data }) as AxiosResponse;

describe("envelope", () => {
  it("returns the body untouched", () => {
    expect(envelope<{ id: number }>(res({ data: { id: 1 } })).data).toEqual({ id: 1 });
  });

  it.each([null, undefined])("rejects an empty body (%s)", (body) => {
    expect(() => envelope(res(body))).toThrow("Phản hồi rỗng");
  });
});

describe("envelopeArray", () => {
  it("accepts an array", () => {
    expect(envelopeArray<number>(res({ data: [1, 2] })).data).toEqual([1, 2]);
  });

  it.each([{ data: {} }, { data: "x" }, { data: null }, {}])(
    "rejects a non-array body %j",
    (body) => {
      expect(() => envelopeArray(res(body))).toThrow("danh sách");
    },
  );
});

describe("pagedEnvelope", () => {
  it("passes data and meta through", () => {
    const out = pagedEnvelope<number>(res({ data: [1], meta: { current_page: 2, total: 9 } }));
    expect(out).toEqual({ data: [1], meta: { current_page: 2, total: 9 } });
  });

  it("defaults a missing meta to an empty object", () => {
    expect(pagedEnvelope<number>(res({ data: [] })).meta).toEqual({});
  });

  it.each([null, undefined, {}, { data: "no" }])("rejects a malformed body %j", (body) => {
    expect(() => pagedEnvelope(res(body))).toThrow("phân trang");
  });
});
