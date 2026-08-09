import { describe, it, expect } from "vitest";
import { elidePath } from "./path-display";

const joined = (p: { prefix: string; name: string }) => p.prefix + p.name;

describe("elidePath", () => {
  it("leaves a path that fits untouched", () => {
    const p = elidePath("C:\\projects\\apps\\mdedit\\README.md");
    expect(p.prefix).toBe("C:\\projects\\apps\\mdedit\\");
    expect(p.name).toBe("README.md");
    expect(joined(p)).not.toContain("…");
  });

  it("drops the middle, keeping the drive, the last folders and the file", () => {
    const p = elidePath(
      "C:\\Users\\lexandro\\AppData\\Local\\Temp\\claude\\C--projects-apps-mdedit\\f81540c3-f184-4622-9edc-c8098b281f38\\scratchpad\\big.md",
    );
    expect(p.prefix.startsWith("C:\\…\\")).toBe(true);
    expect(p.prefix.endsWith("scratchpad\\")).toBe(true);
    expect(p.name).toBe("big.md");
    expect(joined(p).length).toBeLessThanOrEqual(90);
  });

  it("never truncates the file name, however long the path", () => {
    const p = elidePath(`C:\\a\\${"x".repeat(200)}\\a-very-long-file-name.md`, 40);
    expect(p.name).toBe("a-very-long-file-name.md");
  });

  it("always keeps the immediate parent folder", () => {
    const p = elidePath("C:\\one\\two\\three\\four\\five\\six\\file.md", 20);
    expect(p.prefix.endsWith("six\\")).toBe(true);
    expect(p.prefix.startsWith("C:\\…\\")).toBe(true);
  });

  it("handles posix separators", () => {
    const p = elidePath("/home/me/notes/todo.md");
    expect(joined(p)).toBe("/home/me/notes/todo.md");
  });

  it("returns a bare file name with no prefix", () => {
    expect(elidePath("todo.md")).toEqual({ prefix: "", name: "todo.md" });
  });
});
