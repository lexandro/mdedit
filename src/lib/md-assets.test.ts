import { describe, it, expect } from "vitest";
import { dirname, joinPath, toAbsoluteImagePath } from "./md-assets";

describe("dirname", () => {
  it("returns the parent directory (normalizing separators)", () => {
    expect(dirname("C:\\a\\b\\file.md")).toBe("C:/a/b");
    expect(dirname("/a/b/file.md")).toBe("/a/b");
    expect(dirname("file.md")).toBe("");
  });
});

describe("joinPath", () => {
  it("joins and collapses . and ..", () => {
    expect(joinPath("C:/a/b", "img/x.png")).toBe("C:/a/b/img/x.png");
    expect(joinPath("C:/a/b", "../x.png")).toBe("C:/a/x.png");
    expect(joinPath("C:/a/b", "./x.png")).toBe("C:/a/b/x.png");
  });
});

describe("toAbsoluteImagePath", () => {
  it("passes through remote/data URLs (returns null)", () => {
    expect(toAbsoluteImagePath("https://x/y.png", "C:/a")).toBeNull();
    expect(toAbsoluteImagePath("data:image/png;base64,AA", "C:/a")).toBeNull();
  });
  it("resolves a relative path against the base dir", () => {
    expect(toAbsoluteImagePath("img/x.png", "C:/docs")).toBe("C:/docs/img/x.png");
  });
  it("keeps an already-absolute Windows path (normalized)", () => {
    expect(toAbsoluteImagePath("D:\\pics\\x.png", null)).toBe("D:/pics/x.png");
  });
  it("returns null for relative paths without a base dir or root-relative paths", () => {
    expect(toAbsoluteImagePath("img/x.png", null)).toBeNull();
    expect(toAbsoluteImagePath("/abs/x.png", "C:/a")).toBeNull();
  });
});
