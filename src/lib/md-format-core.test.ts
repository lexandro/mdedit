import { describe, it, expect } from "vitest";
import { toggleEmphasis, nextListPrefix, linkFromPaste } from "./md-format-core";

describe("toggleEmphasis", () => {
  it("wraps unwrapped text, selecting the inner text", () => {
    expect(toggleEmphasis("bold", "", "", "**")).toEqual({
      insert: "**bold**",
      fromDelta: 0,
      toDelta: 0,
      selStart: 2,
      selLen: 4,
    });
  });
  it("unwraps when the markers are inside the selection", () => {
    expect(toggleEmphasis("**bold**", "", "", "**")).toEqual({
      insert: "bold",
      fromDelta: 0,
      toDelta: 0,
      selStart: 0,
      selLen: 4,
    });
  });
  it("unwraps when the markers sit just outside the selection (the toggle bug)", () => {
    // doc: **bold**, with only "bold" selected
    expect(toggleEmphasis("bold", "**", "**", "**")).toEqual({
      insert: "bold",
      fromDelta: -2,
      toDelta: 2,
      selStart: 0,
      selLen: 4,
    });
  });
  it("does not treat a surrounding bold `**` as italic `*`", () => {
    // applying italic inside **bold** should add italic, not peel a bold star
    expect(toggleEmphasis("foo", "**", "**", "*").insert).toBe("*foo*");
  });
  it("toggles inline code too", () => {
    expect(toggleEmphasis("x", "", "", "`").insert).toBe("`x`");
    expect(toggleEmphasis("x", "`", "`", "`").insert).toBe("x");
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

describe("linkFromPaste", () => {
  it("wraps a selection when a URL is pasted", () => {
    expect(linkFromPaste("docs", "https://x.com/a")).toBe("[docs](https://x.com/a)");
    expect(linkFromPaste("mail", "mailto:a@b.com")).toBe("[mail](mailto:a@b.com)");
  });
  it("returns null without a selection, for non-URLs, or multi-token text", () => {
    expect(linkFromPaste("", "https://x.com")).toBeNull();
    expect(linkFromPaste("sel", "just text")).toBeNull();
    expect(linkFromPaste("sel", "https://x.com and more")).toBeNull();
  });
});
