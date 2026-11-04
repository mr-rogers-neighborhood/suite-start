import { describe, expect, it } from "vitest";
import { base64ToBytes, bytesToBase64 } from "./base64.js";

describe("base64 round trip", () => {
  it("survives an empty payload", () => {
    expect(bytesToBase64(new Uint8Array())).toBe("");
    expect(base64ToBytes("")).toEqual(new Uint8Array());
  });

  it("round-trips arbitrary bytes", () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255, 42]);
    const decoded = base64ToBytes(bytesToBase64(bytes));
    expect(decoded).toEqual(bytes);
  });

  it("handles a payload larger than one chunk", () => {
    // 100_000 bytes crosses the 0x8000 chunk boundary three times, which is the
    // size that used to throw a stack error before the loop existed.
    const bytes = new Uint8Array(100_000);
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = index % 251;
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});

describe("base64ToBytes", () => {
  it("reports a value that is not base64 instead of throwing", () => {
    expect(base64ToBytes("not base64 !!")).toBeNull();
    expect(base64ToBytes("!!!!")).toBeNull();
  });
});
