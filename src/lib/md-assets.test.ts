import { describe, it, expect } from "vitest";
import {
  dirname,
  joinPath,
  toAbsoluteImagePath,
  encodeMarkdownLinkPath,
  isUncPath,
  toPosix,
} from "./md-assets";

describe("toPosix", () => {
  it("normalizes separators and strips the \\\\?\\ prefix", () => {
    expect(toPosix("C:\\a\\b")).toBe("C:/a/b");
    expect(toPosix("\\\\?\\C:\\a\\b")).toBe("C:/a/b");
    expect(toPosix("already/posix")).toBe("already/posix");
  });
});

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
  it("decodes percent-encoded srcs (markdown-it encodes \\ and spaces)", () => {
    expect(
      toAbsoluteImagePath("C:%5CUsers%5Cme%5CAppData%5CRoaming%5Capp/pasted-images/x.png", null),
    ).toBe("C:/Users/me/AppData/Roaming/app/pasted-images/x.png");
    expect(toAbsoluteImagePath("img/my%20pic.png", "C:/docs")).toBe("C:/docs/img/my pic.png");
  });
  it("tolerates a malformed % sequence", () => {
    expect(toAbsoluteImagePath("img/100%.png", "C:/docs")).toBe("C:/docs/img/100%.png");
  });
  it("returns null for relative paths without a base dir or root-relative paths", () => {
    expect(toAbsoluteImagePath("img/x.png", null)).toBeNull();
    expect(toAbsoluteImagePath("/abs/x.png", "C:/a")).toBeNull();
  });
});

describe("isUncPath / UNC blocking", () => {
  it("detects UNC paths, raw and percent-encoded", () => {
    expect(isUncPath("\\\\host\\share\\x.png")).toBe(true);
    expect(isUncPath("//host/share/x.png")).toBe(true);
    expect(isUncPath("%5C%5Chost%5Cshare%5Cx.png")).toBe(true);
    expect(isUncPath("C:/pics/x.png")).toBe(false);
    expect(isUncPath("img/x.png")).toBe(false);
  });
  it("never resolves a UNC src to a filesystem path", () => {
    expect(toAbsoluteImagePath("%5C%5Cattacker.com%5Cshare%5Cx.png", "C:/docs")).toBeNull();
    expect(toAbsoluteImagePath("\\\\attacker.com\\share\\x.png", "C:/docs")).toBeNull();
  });
});

describe("encodeMarkdownLinkPath", () => {
  it("percent-encodes chars that break a Markdown link destination", () => {
    expect(encodeMarkdownLinkPath("C:/Users/John Doe/x.png")).toBe("C:/Users/John%20Doe/x.png");
    expect(encodeMarkdownLinkPath("C:/a (1)/b#2/50%.png")).toBe("C:/a%20%281%29/b%232/50%25.png");
  });
  it("leaves separators and safe chars intact", () => {
    expect(encodeMarkdownLinkPath("images/pasted-123.png")).toBe("images/pasted-123.png");
  });
  it("round-trips a spaced/parenthesized path back through toAbsoluteImagePath", () => {
    const enc = encodeMarkdownLinkPath("C:/Users/John Doe/pics (raw)/x.png");
    expect(toAbsoluteImagePath(enc, null)).toBe("C:/Users/John Doe/pics (raw)/x.png");
  });
});
