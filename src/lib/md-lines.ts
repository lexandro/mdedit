// Iterate a Markdown source line by line while tracking fenced code blocks, so
// callers can skip or special-case code without re-implementing fence detection.
export interface ScannedLine {
  text: string;
  index: number; // 0-based line number
  isFence: boolean; // the ``` / ~~~ delimiter line itself
  inFence: boolean; // a content line inside a fenced code block
}

export function* scanLines(src: string): Generator<ScannedLine> {
  let fence: string | null = null;
  const lines = src.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const text = lines[index];
    const m = text.match(/^\s*(```+|~~~+)/);
    const isFence = m !== null;
    if (isFence) {
      const marker = m![1][0];
      if (fence === null) fence = marker;
      else if (text.trim().startsWith(fence)) fence = null;
    }
    yield { text, index, isFence, inFence: fence !== null && !isFence };
  }
}
