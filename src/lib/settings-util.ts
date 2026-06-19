// Pure settings math (bounds, clamping, wheel-zoom step). No Svelte/Tauri here
// so it is unit-testable; settings.svelte.ts and Editor.svelte import from it.

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.8;
export const ZOOM_STEP = 0.1;
export const FONT_MIN = 10;
export const FONT_MAX = 28;
export const DEBOUNCE_MIN = 0;
export const DEBOUNCE_MAX = 1000;
export const DEBOUNCE_STEP = 25;
export const AUTOSAVE_MIN = 500;
export const AUTOSAVE_MAX = 30000;
export const AUTOSAVE_STEP = 500;

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

/** Clamp the preview render debounce (milliseconds). */
export function clampDebounce(ms: number): number {
  return clamp(Math.round(ms), DEBOUNCE_MIN, DEBOUNCE_MAX);
}

/** Clamp the autosave delay (milliseconds). */
export function clampAutosaveDelay(ms: number): number {
  return clamp(Math.round(ms), AUTOSAVE_MIN, AUTOSAVE_MAX);
}

/** Next editor font size for a Ctrl+wheel step (wheel up = bigger). */
export function fontSizeForWheel(current: number, deltaY: number): number {
  return clampFontSize(current + (deltaY < 0 ? 1 : -1));
}
