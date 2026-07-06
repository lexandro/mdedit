// Pure snippet core: built-in definitions, variable expansion and the inline
// /trigger matcher. Kept CodeMirror/Svelte/Tauri-free so it is unit-testable;
// editor-snippets.ts bridges to CodeMirror's snippet() for ${field} tab-stops.
import { formatDate, formatTime, formatDateTime, type DateFormat } from "$lib/date-format";

export interface Snippet {
  id: string; // stable id; i18n label key is `snippet.${id}` when label is absent
  trigger: string; // inline trigger word, typed as /trigger
  body: string; // ${field} tab-stops + {date}/{time}/{datetime} variables
  label?: string; // user-given display name (user snippets only; built-ins localize)
}

export interface SnippetEnv {
  now: Date;
  format: DateFormat;
  locale?: string;
}

/** Replace {date}/{time}/{datetime}; the lookbehind keeps ${...} fields intact. */
export function expandVariables(body: string, env: SnippetEnv): string {
  return body.replace(/(?<!\$)\{(date|time|datetime)\}/g, (_, name: string) => {
    const fn = name === "date" ? formatDate : name === "time" ? formatTime : formatDateTime;
    return fn(env.now, env.format, env.locale);
  });
}

/** Offset of a trailing /word in the text before the cursor, or null. Only at
 *  line start or after whitespace, so https:// and mid-word slashes don't open
 *  the completion tooltip. */
export function matchTrigger(before: string): number | null {
  const m = /(?:^|\s)(\/[\w-]*)$/.exec(before);
  return m ? m.index + m[0].length - m[1].length : null;
}

export const BUILTIN_SNIPPETS: Snippet[] = [
  { id: "date", trigger: "date", body: "{date}" },
  { id: "time", trigger: "time", body: "{time}" },
  { id: "datetime", trigger: "datetime", body: "{datetime}" },
  {
    id: "frontmatter",
    trigger: "frontmatter",
    body: "---\ntitle: ${title}\ndate: {date}\ntags: [${tags}]\n---\n${}\n",
  },
  { id: "code", trigger: "code", body: "```${lang}\n${}\n```" },
  {
    id: "table",
    trigger: "table",
    body: "| ${Column 1} | ${Column 2} |\n| --- | --- |\n| ${} |  |\n",
  },
  { id: "task", trigger: "task", body: "- [ ] ${first task}\n- [ ] ${}" },
  { id: "linkref", trigger: "linkref", body: "[${label}][${ref}]\n\n[${ref}]: ${url}" },
  { id: "footnote", trigger: "footnote", body: "[^${id}]\n\n[^${id}]: ${note}" },
  { id: "callout", trigger: "callout", body: "> [!${NOTE}]\n> ${}" },
  {
    id: "details",
    trigger: "details",
    body: "<details>\n<summary>${summary}</summary>\n\n${}\n\n</details>",
  },
];
