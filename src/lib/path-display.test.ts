import { describe, it, expect } from "vitest";
import { displayDir } from "./path-display";

describe("displayDir", () => {
  it("returns a short folder whole, drive included", () => {
    expect(displayDir("C:\\projects\\apps\\mdedit\\README.md")).toBe("C:\\projects\\apps\\mdedit");
  });

  it("keeps the tail of a long folder and marks the trim", () => {
    const out = displayDir(
      "C:\\Users\\lexandro\\AppData\\Local\\Temp\\claude\\C--projects-apps-mdedit\\f81540c3-f184-4622-9edc-c8098b281f38\\scratchpad\\big.md",
    );
    expect(out.startsWith("…\\")).toBe(true);
    expect(out.endsWith("scratchpad")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(48);
  });

  it("always keeps the immediate parent, however long", () => {
    const long = "x".repeat(200);
    expect(displayDir(`C:\\a\\${long}\\file.md`)).toBe(`…\\${long}`);
  });

  it("handles posix separators", () => {
    expect(displayDir("/home/me/notes/todo.md")).toBe("/home/me/notes");
  });

  it("returns empty for a bare file name", () => {
    expect(displayDir("todo.md")).toBe("");
  });
});
