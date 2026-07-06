import { describe, it, expect } from "vitest";
import {
  splitCells,
  parseTableBlock,
  serializeTable,
  emptyTable,
  findTableAt,
  type TableModel,
} from "./table-model";

describe("splitCells", () => {
  it("splits a piped row and trims cells", () => {
    expect(splitCells("| a | b |")).toEqual(["a", "b"]);
  });
  it("handles rows without edge pipes", () => {
    expect(splitCells("a | b")).toEqual(["a", "b"]);
  });
  it("keeps empty cells", () => {
    expect(splitCells("| | |")).toEqual(["", ""]);
    expect(splitCells("| a ||")).toEqual(["a", ""]);
  });
  it("unescapes \\| into a literal pipe", () => {
    expect(splitCells("| a \\| b | c |")).toEqual(["a | b", "c"]);
  });
  it("handles an escaped pipe at the end of a cell", () => {
    expect(splitCells("| a\\| | b |")).toEqual(["a|", "b"]);
  });
  it("handles a cell that is only an escaped pipe", () => {
    expect(splitCells("| \\| |")).toEqual(["|"]);
  });
  it("does not treat a trailing escaped pipe as a closing pipe", () => {
    expect(splitCells("| a | b \\|")).toEqual(["a", "b |"]);
  });
});

describe("parseTableBlock", () => {
  it("parses header, alignments and body", () => {
    const t = parseTableBlock(["| a | b |", "| :-- | --: |", "| 1 | 2 |"]);
    expect(t).toEqual({
      aligns: ["left", "right"],
      cells: [
        ["a", "b"],
        ["1", "2"],
      ],
    });
  });
  it("parses all four alignments", () => {
    const t = parseTableBlock(["| a | b | c | d |", "| --- | :-- | :-: | --: |"]);
    expect(t.aligns).toEqual(["none", "left", "center", "right"]);
  });
  it("normalizes ragged rows to the widest row", () => {
    const t = parseTableBlock(["| a |", "| --- |", "| 1 | 2 | 3 |"]);
    expect(t.aligns).toEqual(["none", "none", "none"]);
    expect(t.cells).toEqual([
      ["a", "", ""],
      ["1", "2", "3"],
    ]);
  });
  it("parses a single-column table", () => {
    const t = parseTableBlock(["| a |", "| --- |", "| 1 |"]);
    expect(t).toEqual({ aligns: ["none"], cells: [["a"], ["1"]] });
  });
  it("parses a header-only table", () => {
    const t = parseTableBlock(["| a | b |", "| --- | --- |"]);
    expect(t.cells).toEqual([["a", "b"]]);
  });
  it("keeps empty header cells", () => {
    const t = parseTableBlock(["| | b |", "| --- | --- |"]);
    expect(t.cells[0]).toEqual(["", "b"]);
  });
});

describe("serializeTable", () => {
  it("pads columns to min width 3 with alignment markers", () => {
    const t: TableModel = { aligns: ["left", "center", "right"], cells: [["a", "b", "c"]] };
    expect(serializeTable(t)).toEqual(["| a   |  b  |   c |", "| :-- | :-: | --: |"]);
  });
  it("escapes literal pipes and pads on the escaped length", () => {
    const t: TableModel = {
      aligns: ["none", "none"],
      cells: [
        ["a|b", "x"],
        ["1", "2"],
      ],
    };
    const lines = serializeTable(t);
    expect(lines[0]).toBe("| a\\|b | x   |");
    expect(lines[2]).toBe("| 1    | 2   |");
  });
  it("passes inline markdown through verbatim", () => {
    const t: TableModel = { aligns: ["none"], cells: [["**bold** `code`"]] };
    expect(serializeTable(t)[0]).toBe("| **bold** `code` |");
  });
});

describe("round-trips", () => {
  const model: TableModel = {
    aligns: ["left", "none", "right"],
    cells: [
      ["Name", "Notes", "Qty"],
      ["a | b", "**bold**", "12"],
      ["", "`x|y`", ""],
    ],
  };
  it("parse(serialize(m)) equals m, including literal pipes", () => {
    expect(parseTableBlock(serializeTable(model))).toEqual(model);
  });
  it("serialize is idempotent through parse", () => {
    const once = serializeTable(model);
    expect(serializeTable(parseTableBlock(once))).toEqual(once);
  });
  it("survives a ragged escaped-pipe source", () => {
    const src = ["a \\| b | c", "--- | ---", "| 1 |"];
    const t = parseTableBlock(src);
    expect(parseTableBlock(serializeTable(t))).toEqual(t);
  });
});

describe("emptyTable", () => {
  it("builds an all-empty model", () => {
    expect(emptyTable(2, 2)).toEqual({
      aligns: ["none", "none"],
      cells: [
        ["", ""],
        ["", ""],
      ],
    });
  });
});

describe("findTableAt", () => {
  const doc = "before\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\nafter";
  const from = doc.indexOf("| a");
  const to = doc.indexOf("| 1 | 2 |") + "| 1 | 2 |".length;

  it("finds the table from a mid-cell offset", () => {
    expect(findTableAt(doc, doc.indexOf("1"))).toEqual({ from, to });
  });
  it("finds it from the separator row", () => {
    expect(findTableAt(doc, doc.indexOf("---"))).toEqual({ from, to });
  });
  it("includes the first and last character", () => {
    expect(findTableAt(doc, from)).toEqual({ from, to });
    expect(findTableAt(doc, to)).toEqual({ from, to });
  });
  it("returns null just outside the block", () => {
    expect(findTableAt(doc, from - 1)).toBeNull();
    expect(findTableAt(doc, to + 1)).toBeNull();
  });
  it("returns null in plain text and pipe-only text", () => {
    expect(findTableAt(doc, 0)).toBeNull();
    expect(findTableAt("a | b\nno separator", 2)).toBeNull();
  });
  it("handles a table at the start and end of the document", () => {
    const d = "| a |\n| --- |\n| 1 |";
    expect(findTableAt(d, 0)).toEqual({ from: 0, to: d.length });
    expect(findTableAt(d, d.length)).toEqual({ from: 0, to: d.length });
  });
  it("resolves the right one of two tables", () => {
    const t1 = "| a |\n| --- |\n| 1 |";
    const t2 = "| x |\n| --- |\n| 9 |";
    const d = t1 + "\n\n" + t2;
    expect(findTableAt(d, d.indexOf("9"))).toEqual({ from: t1.length + 2, to: d.length });
    expect(findTableAt(d, d.indexOf("1"))).toEqual({ from: 0, to: t1.length });
  });
});
