import { describe, it, expect } from "vitest";
import { formatDate, formatTime, formatDateTime } from "./date-format";

const d = new Date(2026, 6, 5, 9, 7); // local 2026-07-05 09:07

describe("formatDate", () => {
  it("iso uses local date parts, zero-padded", () => {
    expect(formatDate(d, "iso")).toBe("2026-07-05");
  });
  it("locale output differs from iso and contains the year", () => {
    const s = formatDate(d, "locale", "hu");
    expect(s).toContain("2026");
    expect(s).not.toBe("2026-07-05");
  });
});

describe("formatTime", () => {
  it("iso is HH:MM", () => {
    expect(formatTime(d, "iso")).toBe("09:07");
  });
  it("locale contains minutes", () => {
    expect(formatTime(d, "locale", "en")).toContain("07");
  });
});

describe("formatDateTime", () => {
  it("joins date and time with a space", () => {
    expect(formatDateTime(d, "iso")).toBe("2026-07-05 09:07");
  });
});
