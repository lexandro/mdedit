import { describe, it, expect } from "vitest";
import {
  headingClass,
  STYLE_CLASS,
  MARKER_NODES,
  markerHidden,
  isFollowableUrl,
  parseImage,
} from "./live-preview-core";

describe("headingClass", () => {
  it("maps levels to classes and clamps to 1–6", () => {
    expect(headingClass(1)).toBe("cm-lp-h1");
    expect(headingClass(6)).toBe("cm-lp-h6");
    expect(headingClass(9)).toBe("cm-lp-h6");
    expect(headingClass(0)).toBe("cm-lp-h1");
  });
});

describe("STYLE_CLASS / MARKER_NODES", () => {
  it("styles the expected inline nodes", () => {
    expect(STYLE_CLASS.StrongEmphasis).toBe("cm-lp-strong");
    expect(STYLE_CLASS.InlineCode).toBe("cm-lp-code");
    expect(STYLE_CLASS.Paragraph).toBeUndefined();
  });
  it("knows the marker nodes", () => {
    expect(MARKER_NODES.has("EmphasisMark")).toBe(true);
    expect(MARKER_NODES.has("HeaderMark")).toBe(true);
    expect(MARKER_NODES.has("Paragraph")).toBe(false);
  });
});

describe("markerHidden", () => {
  it("hides a marker unless its line is active", () => {
    const active = new Set([3, 4]);
    expect(markerHidden(2, active)).toBe(true);
    expect(markerHidden(3, active)).toBe(false);
  });
});

describe("isFollowableUrl", () => {
  it("accepts http(s) and mailto, rejects others", () => {
    expect(isFollowableUrl("https://example.com")).toBe(true);
    expect(isFollowableUrl("  http://x ")).toBe(true);
    expect(isFollowableUrl("mailto:a@b.com")).toBe(true);
    expect(isFollowableUrl("./local.md")).toBe(false);
    expect(isFollowableUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("parseImage", () => {
  it("parses alt + url, with or without a title", () => {
    expect(parseImage("![cat](img/cat.png)")).toEqual({ alt: "cat", url: "img/cat.png" });
    expect(parseImage('![](https://x/y.jpg "t")')).toEqual({ alt: "", url: "https://x/y.jpg" });
  });
  it("returns null for non-image text", () => {
    expect(parseImage("[link](url)")).toBeNull();
    expect(parseImage("plain")).toBeNull();
  });
});
