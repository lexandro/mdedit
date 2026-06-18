import { describe, it, expect } from "vitest";
import { serializeSession } from "./session-util";

const tab = (over: Partial<Parameters<typeof serializeSession>[0][number]> = {}) => ({
  id: 1,
  path: "C:/a/x.md",
  content: "hi",
  savedContent: "hi",
  viewMode: "split" as const,
  lineEnding: "lf" as const,
  encoding: "utf-8" as const,
  ...over,
});

describe("serializeSession", () => {
  it("stores only the path for clean saved tabs (no unsaved buffer)", () => {
    const data = serializeSession([tab()], 1);
    expect(data.tabs[0]).toEqual({
      path: "C:/a/x.md",
      viewMode: "split",
      lineEnding: "lf",
      encoding: "utf-8",
    });
    expect(data.activeIndex).toBe(0);
  });

  it("keeps the buffer for dirty saved tabs", () => {
    const data = serializeSession([tab({ content: "edited", savedContent: "hi" })], 1);
    expect(data.tabs[0].unsaved).toBe("edited");
  });

  it("keeps the buffer for untitled tabs and drops empty untitled ones", () => {
    const data = serializeSession(
      [tab({ id: 2, path: null, content: "scratch", savedContent: "" }), tab({ id: 3, path: null, content: "", savedContent: "" })],
      2,
    );
    expect(data.tabs).toHaveLength(1);
    expect(data.tabs[0]).toEqual({ path: null, viewMode: "split", lineEnding: "lf", encoding: "utf-8", unsaved: "scratch" });
    expect(data.activeIndex).toBe(0);
  });

  it("reports -1 active index when the active tab was dropped", () => {
    expect(serializeSession([], 5).activeIndex).toBe(-1);
  });
});
