// Pure settings math (bounds, clamping, wheel-zoom step). No Svelte/Tauri here
// so it is unit-testable; settings.svelte.ts and Editor.svelte import from it.

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.8;
export const ZOOM_STEP = 0.1;
export const FONT_MIN = 10;
export const FONT_MAX = 28;

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Round to whole percent and clamp to the UI-zoom range. */
export function clampZoom(zoom: number): number {
  return clamp(Math.round(zoom * 100) / 100, ZOOM_MIN, ZOOM_MAX);
}

export function clampFontSize(px: number): number {
  return clamp(Math.round(px), FONT_MIN, FONT_MAX);
}

/** Next editor font size for a Ctrl+wheel step (wheel up = bigger). */
export function fontSizeForWheel(current: number, deltaY: number): number {
  return clampFontSize(current + (deltaY < 0 ? 1 : -1));
}
