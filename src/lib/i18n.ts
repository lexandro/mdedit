// Tiny i18n: t(key) resolves against the current locale (settings.language).
// Reading settings.language here makes any component that calls t() in markup
// re-render reactively when the language changes.
import { settings } from "$lib/stores/settings.svelte";
import { en } from "$lib/locales/en";
import { hu } from "$lib/locales/hu";

const dicts: Record<string, Record<string, string>> = { en, hu };

export function t(key: string, params?: Record<string, string | number>): string {
  const lang = settings.language === "hu" ? "hu" : "en";
  let s = dicts[lang][key] ?? en[key] ?? key;
  if (params) {
    for (const k in params) s = s.replaceAll(`{${k}}`, String(params[k]));
  }
  return s;
}
