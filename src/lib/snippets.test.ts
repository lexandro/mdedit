import { describe, it, expect } from "vitest";
import { BUILTIN_SNIPPETS, expandVariables, matchTrigger } from "./snippets";
import { splitFrontmatter } from "./frontmatter";

const env = { now: new Date(2026, 6, 5, 9, 7), format: "iso" as const };

describe("expandVariables", () => {
  it("substitutes each variable", () => {
    expect(expandVariables("{date} {time} {datetime}", env)).toBe(
      "2026-07-05 09:07 2026-07-05 09:07",
    );
  });
  it("substitutes repeated occurrences", () => {
    expect(expandVariables("{date}/{date}", env)).toBe("2026-07-05/2026-07-05");
  });
  it("leaves ${field} tab-stops untouched", () => {
    expect(expandVariables("${title} {date} ${}", env)).toBe("${title} 2026-07-05 ${}");
  });
  it("leaves a field named ${date} untouched (lookbehind)", () => {
    expect(expandVariables("${date}", env)).toBe("${date}");
  });
  it("leaves unknown braces untouched", () => {
    expect(expandVariables("{foo}", env)).toBe("{foo}");
  });
});

describe("matchTrigger", () => {
  it("matches / at line start", () => {
    expect(matchTrigger("/")).toBe(0);
    expect(matchTrigger("/ta")).toBe(0);
  });
  it("matches /word after whitespace", () => {
    expect(matchTrigger("foo /ta")).toBe(4);
  });
  it("rejects URLs and mid-word slashes", () => {
    expect(matchTrigger("https://")).toBeNull();
    expect(matchTrigger("a/b")).toBeNull();
  });
  it("rejects empty text", () => {
    expect(matchTrigger("")).toBeNull();
  });
});

describe("BUILTIN_SNIPPETS invariants", () => {
  it("has unique ids and triggers", () => {
    const ids = BUILTIN_SNIPPETS.map((s) => s.id);
    const triggers = BUILTIN_SNIPPETS.map((s) => s.trigger);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(triggers).size).toBe(triggers.length);
  });
  it("triggers are plain words (matchable by /trigger)", () => {
    for (const s of BUILTIN_SNIPPETS) expect(s.trigger).toMatch(/^[\w-]+$/);
  });
  it("every ${ field is closed and never named after a variable", () => {
    for (const s of BUILTIN_SNIPPETS) {
      const fields = s.body.match(/\$\{[^}]*\}/g) ?? [];
      expect(s.body.split("${").length - 1).toBe(fields.length);
      for (const f of fields) expect(f).not.toMatch(/^\$\{(date|time|datetime)\}$/);
    }
  });
  it("code snippet has a closing fence", () => {
    const code = BUILTIN_SNIPPETS.find((s) => s.id === "code")!;
    expect(code.body.match(/```/g)).toHaveLength(2);
  });
});

describe("round-trip", () => {
  it("expanded frontmatter snippet is recognized by splitFrontmatter", () => {
    const fm = BUILTIN_SNIPPETS.find((s) => s.id === "frontmatter")!;
    const text = expandVariables(fm.body, env).replace(/\$\{([^}]*)\}/g, "$1");
    const { frontmatter } = splitFrontmatter(text);
    expect(frontmatter).toContain("title:");
    expect(frontmatter).toContain("date: 2026-07-05");
  });
});
