import { describe, it, expect } from "vitest";
import { mnemonicIndex } from "./menu-util";

const LABELS = ["File", "Edit", "View", "Help"];

describe("mnemonicIndex", () => {
  it("matches the first letter, case-insensitively", () => {
    expect(mnemonicIndex(LABELS, "f")).toBe(0);
    expect(mnemonicIndex(LABELS, "E")).toBe(1);
    expect(mnemonicIndex(LABELS, "v")).toBe(2);
    expect(mnemonicIndex(LABELS, "H")).toBe(3);
  });
  it("returns -1 when nothing matches", () => {
    expect(mnemonicIndex(LABELS, "z")).toBe(-1);
  });
});
