import { describe, it, expect } from "vitest";
import {
  clampFontSize,
  clampZoom,
  clampDebounce,
  fontSizeForWheel,
  FONT_MIN,
  FONT_MAX,
  ZOOM_MIN,
  ZOOM_MAX,
  DEBOUNCE_MAX,
} from "./settings-util";

describe("clampFontSize", () => {
  it("clamps to the allowed range and rounds", () => {
    expect(clampFontSize(5)).toBe(FONT_MIN);
    expect(clampFontSize(999)).toBe(FONT_MAX);
    expect(clampFontSize(14.6)).toBe(15);
  });
});

describe("clampZoom", () => {
  it("clamps and rounds to whole percent", () => {
    expect(clampZoom(0.1)).toBe(ZOOM_MIN);
    expect(clampZoom(5)).toBe(ZOOM_MAX);
    expect(clampZoom(1.234)).toBe(1.23);
  });
});

describe("clampDebounce", () => {
  it("clamps to 0..max and rounds", () => {
    expect(clampDebounce(-50)).toBe(0);
    expect(clampDebounce(99999)).toBe(DEBOUNCE_MAX);
    expect(clampDebounce(100.4)).toBe(100);
  });
});

describe("fontSizeForWheel (Ctrl+wheel zoom)", () => {
  it("grows on wheel up (negative deltaY) and shrinks on wheel down", () => {
    expect(fontSizeForWheel(14, -100)).toBe(15);
    expect(fontSizeForWheel(14, 100)).toBe(13);
  });
  it("never exceeds the bounds", () => {
    expect(fontSizeForWheel(FONT_MAX, -100)).toBe(FONT_MAX);
    expect(fontSizeForWheel(FONT_MIN, 100)).toBe(FONT_MIN);
  });
});
