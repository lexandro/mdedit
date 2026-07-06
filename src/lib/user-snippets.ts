// Pure core for user-defined snippets: validating the untrusted contents of
// snippets.json, merging with the built-ins (a user trigger shadows the
// built-in one), and field validation for the manager dialog.
import type { Snippet } from "$lib/snippets";

export interface UserSnippet extends Snippet {
  label: string;
}

export const TRIGGER_RE = /^[\w-]+$/;

function isValid(s: UserSnippet): boolean {
  return (
    typeof s.id === "string" &&
    s.id.length > 0 &&
    typeof s.trigger === "string" &&
    TRIGGER_RE.test(s.trigger) &&
    typeof s.body === "string" &&
    s.body.length > 0 &&
    typeof s.label === "string" &&
    s.label.trim().length > 0
  );
}

/** Store JSON -> clean list: drops malformed entries and id/trigger duplicates. */
export function parseUserSnippets(raw: unknown): UserSnippet[] {
  if (!Array.isArray(raw)) return [];
  const out: UserSnippet[] = [];
  for (const r of raw) {
    if (typeof r !== "object" || r === null) continue;
    const { id, trigger, body, label } = r as UserSnippet;
    const s = { id, trigger, body, label };
    if (isValid(s) && !out.some((o) => o.id === s.id || o.trigger === s.trigger)) out.push(s);
  }
  return out;
}

/** Built-ins plus user snippets; a user trigger replaces the built-in one. */
export function mergeSnippets(builtin: Snippet[], user: UserSnippet[]): Snippet[] {
  const shadowed = new Set(user.map((s) => s.trigger));
  return [...builtin.filter((b) => !shadowed.has(b.trigger)), ...user];
}

export type SnippetFieldError = "label" | "trigger" | "duplicate" | "body";

/** Manager-dialog validation; `others` excludes the snippet being edited. */
export function validateUserSnippet(
  s: { label: string; trigger: string; body: string },
  others: UserSnippet[],
): SnippetFieldError | null {
  if (!s.label.trim()) return "label";
  if (!TRIGGER_RE.test(s.trigger)) return "trigger";
  if (others.some((o) => o.trigger === s.trigger)) return "duplicate";
  if (!s.body) return "body";
  return null;
}
