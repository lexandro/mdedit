// Conservative whole-document Markdown tidy-up. Safe by design: fenced code is
// left untouched, hard line breaks (2+ trailing spaces) are preserved (and
// normalized to exactly two), accidental trailing whitespace is trimmed, runs of
// blank lines collapse to one, list bullets normalize to "-", and the file ends
// with exactly one newline.
export function formatMarkdown(src: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  let blankRun = 0;

  for (const raw of src.split("\n")) {
    const fenceMatch = raw.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1][0];
      else if (raw.trim().startsWith(fence)) fence = null;
      out.push(raw.replace(/[ \t]+$/, ""));
      blankRun = 0;
      continue;
    }
    if (fence !== null) {
      out.push(raw); // inside code block — preserve verbatim
      continue;
    }

    const hardBreak = /\S[ \t]{2,}$/.test(raw);
    let line = raw.replace(/[ \t]+$/, "");
    if (line === "") {
      if (++blankRun > 1) continue; // collapse consecutive blank lines
      out.push("");
      continue;
    }
    blankRun = 0;
    line = line.replace(/^(\s*)[*+](\s+)/, "$1-$2"); // normalize bullet marker
    if (hardBreak) line += "  ";
    out.push(line);
  }

  while (out.length && out[0] === "") out.shift();
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.length ? out.join("\n") + "\n" : "";
}
