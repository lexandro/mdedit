// Pure date/time formatting for snippet variables. Kept Tauri/CodeMirror-free
// so it is unit-testable; callers inject the Date and the app locale.

export type DateFormat = "iso" | "locale";

const pad = (n: number) => String(n).padStart(2, "0");

// ISO is built from local getters — toISOString() is UTC and would show the
// previous day in the evening for UTC+ timezones.
export function formatDate(d: Date, fmt: DateFormat, locale?: string): string {
  if (fmt === "iso") return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return d.toLocaleDateString(locale || undefined);
}

export function formatTime(d: Date, fmt: DateFormat, locale?: string): string {
  if (fmt === "iso") return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return d.toLocaleTimeString(locale || undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(d: Date, fmt: DateFormat, locale?: string): string {
  return `${formatDate(d, fmt, locale)} ${formatTime(d, fmt, locale)}`;
}
