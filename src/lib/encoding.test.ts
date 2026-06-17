import { describe, it, expect } from "vitest";
import {
  detectEncoding,
  decodeBytes,
  encodeText,
  detectLineEnding,
  applyLineEnding,
  type Encoding,
} from "./encoding";

const utf8 = (s: string) => new TextEncoder().encode(s);

describe("detectEncoding", () => {
  it("detects a UTF-8 BOM", () => {
    expect(detectEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe("utf-8-bom");
  });
  it("detects UTF-16 LE / BE by BOM", () => {
    expect(detectEncoding(new Uint8Array([0xff, 0xfe, 0x41, 0x00]))).toBe("utf-16le");
    expect(detectEncoding(new Uint8Array([0xfe, 0xff, 0x00, 0x41]))).toBe("utf-16be");
  });
  it("detects plain UTF-8 (incl. accents)", () => {
    expect(detectEncoding(utf8("héllo őúé"))).toBe("utf-8");
  });
  it("falls back to Windows-1250 for invalid UTF-8", () => {
    // 0xE1 ('á' in Windows-1250) is not valid standalone UTF-8 -> "hát"
    expect(detectEncoding(new Uint8Array([0x68, 0xe1, 0x74]))).toBe("windows-1250");
  });
  it("treats empty input as UTF-8", () => {
    expect(detectEncoding(new Uint8Array([]))).toBe("utf-8");
  });
});

describe("decodeBytes", () => {
  it("decodes UTF-8", () => {
    expect(decodeBytes(utf8("# Címsor\nőúé"))).toEqual({ content: "# Címsor\nőúé", encoding: "utf-8" });
  });
  it("decodes UTF-8 BOM and strips the BOM", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8("abc")]);
    expect(decodeBytes(bytes)).toEqual({ content: "abc", encoding: "utf-8-bom" });
  });
  it("decodes Windows-1250 Hungarian accents", () => {
    // "árvíz": á=E1 r=72 v=76 í=ED z=7A
    const bytes = new Uint8Array([0xe1, 0x72, 0x76, 0xed, 0x7a]);
    expect(decodeBytes(bytes)).toEqual({ content: "árvíz", encoding: "windows-1250" });
  });
});

describe("encodeText round-trip", () => {
  const sample = "Árvíztűrő tükörfúrógép\nmásodik sor";
  it.each<Encoding>(["utf-8", "utf-8-bom", "utf-16le", "utf-16be"])("round-trips %s", (e) => {
    expect(decodeBytes(encodeText(sample, e))).toEqual({ content: sample, encoding: e });
  });
  it("encodes Windows-1250 as UTF-8 bytes (legacy is read-only)", () => {
    expect(Array.from(encodeText("á", "windows-1250"))).toEqual(Array.from(utf8("á")));
  });
});

describe("line endings", () => {
  it("detects the dominant ending", () => {
    expect(detectLineEnding("a\r\nb\r\nc")).toBe("crlf");
    expect(detectLineEnding("a\nb\nc")).toBe("lf");
  });
  it("applies an ending (normalizing first)", () => {
    expect(applyLineEnding("a\nb", "crlf")).toBe("a\r\nb");
    expect(applyLineEnding("a\r\nb", "lf")).toBe("a\nb");
  });
});
