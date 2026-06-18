import { describe, it, expect } from "vitest";
import { toggleWrap, nextListPrefix } from "./md-format-core";

describe("toggleWrap", () => {
  it("wraps unwrapped text", () => {
    expect(toggleWrap("bold", "**")).toBe("**bold**");
    expect(toggleWrap("x", "`")).toBe("`x`");
  });
  it("unwraps already-wrapped text (toggle off)", () => {
    expect(toggleWrap("**bold**", "**")).toBe("bold");
  });
  it("wraps empty selection into bare markers", () => {
    expect(toggleWrap("", "**")).toBe("****");
  });
  it("supports distinct before/after", () => {
    expect(toggleWrap("x", "<", ">")).toBe("<x>");
  });
});

describe("nextListPrefix", () => {
  it("returns null for non-list lines", () => {
    expect(nextListPrefix("just text")).toBeNull();
  });
  it("continues a bullet list, preserving indent", () => {
    expect(nextListPrefix("  - item")).toEqual({ prefix: "  - " });
    expect(nextListPrefix("* item")).toEqual({ prefix: "* " });
  });
  it("increments an ordered list", () => {
    expect(nextListPrefix("3. item")).toEqual({ prefix: "4. " });
    expect(nextListPrefix("3) item")).toEqual({ prefix: "4) " });
  });
  it("carries an unchecked task box", () => {
    expect(nextListPrefix("- [x] done")).toEqual({ prefix: "- [ ] " });
  });
  it("exits on an empty item", () => {
    expect(nextListPrefix("- ")).toEqual({ exit: true });
    expect(nextListPrefix("- [ ] ")).toEqual({ exit: true });
  });
});
