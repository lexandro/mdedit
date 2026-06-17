// Pure byte <-> text helpers: detect a file's encoding, decode it, and encode
// it back. Kept free of Tauri imports so it is unit-testable in plain Node.
// Supports UTF-8 (+BOM), UTF-16 LE/BE (via BOM), and a Windows-1250 fallback
// for legacy (e.g. Hungarian) files. Windows-1250 is read-only — saving a such
// file writes UTF-8 (the caller switches the tab's encoding accordingly).

export type Encoding = "utf-8" | "utf-8-bom" | "utf-16le" | "utf-16be" | "windows-1250";
export type LineEnding = "lf" | "crlf";

/** Guess the encoding from the BOM, else valid-UTF-8 test, else Windows-1250. */
export function detectEncoding(bytes: Uint8Array): Encoding {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8-bom";
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return "utf-16le";
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return "utf-16be";
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "utf-8";
  } catch {
    return "windows-1250";
  }
}

const DECODER_LABEL: Record<Encoding, string> = {
  "utf-8": "utf-8",
  "utf-8-bom": "utf-8",
  "utf-16le": "utf-16le",
  "utf-16be": "utf-16be",
  "windows-1250": "windows-1250",
};

/** Detect + decode bytes to a string (a leading BOM is stripped by TextDecoder). */
export function decodeBytes(bytes: Uint8Array): { content: string; encoding: Encoding } {
  const encoding = detectEncoding(bytes);
  const content = new TextDecoder(DECODER_LABEL[encoding]).decode(bytes);
  return { content, encoding };
}

function utf16(content: string, littleEndian: boolean): Uint8Array {
  const out = new Uint8Array(2 + content.length * 2);
  out[0] = littleEndian ? 0xff : 0xfe;
  out[1] = littleEndian ? 0xfe : 0xff;
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    const o = 2 + i * 2;
    if (littleEndian) {
      out[o] = code & 0xff;
      out[o + 1] = code >> 8;
    } else {
      out[o] = code >> 8;
      out[o + 1] = code & 0xff;
    }
  }
  return out;
}

/** Encode a string back to bytes in the given encoding (Windows-1250 -> UTF-8). */
export function encodeText(content: string, encoding: Encoding): Uint8Array {
  const utf8 = () => new TextEncoder().encode(content);
  switch (encoding) {
    case "utf-16le":
      return utf16(content, true);
    case "utf-16be":
      return utf16(content, false);
    case "utf-8-bom": {
      const body = utf8();
      const out = new Uint8Array(body.length + 3);
      out.set([0xef, 0xbb, 0xbf]);
      out.set(body, 3);
      return out;
    }
    default: // utf-8 and windows-1250 (which we never re-encode) -> UTF-8
      return utf8();
  }
}

export function detectLineEnding(text: string): LineEnding {
  const crlf = (text.match(/\r\n/g) ?? []).length;
  const lf = (text.match(/(?<!\r)\n/g) ?? []).length;
  return crlf > lf ? "crlf" : "lf";
}

/** Normalize to LF, then apply the requested ending. */
export function applyLineEnding(text: string, ending: LineEnding): string {
  const lf = text.replace(/\r\n/g, "\n");
  return ending === "crlf" ? lf.replace(/\n/g, "\r\n") : lf;
}
