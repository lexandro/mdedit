import { describe, it, expect } from "vitest";
import { errorMessage } from "./errors";

describe("errorMessage", () => {
  it("uses an Error's message", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });
  it("passes a string through", () => {
    expect(errorMessage("nope")).toBe("nope");
  });
  it("reads .message from a plain object (e.g. Tauri error)", () => {
    expect(errorMessage({ message: "permission denied" })).toBe("permission denied");
  });
  it("stringifies anything else", () => {
    expect(errorMessage(42)).toBe("42");
    expect(errorMessage(null)).toBe("null");
  });
});
