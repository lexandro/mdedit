import { describe, it, expect } from "vitest";
import { formatTablesText } from "./md-tables";

describe("formatTablesText", () => {
  it("pads columns and normalizes the separator with alignment", () => {
    const input = "| a | bb |\n| :-- | --: |\n| 1 | 2222 |";
    expect(formatTablesText(input)).toBe("| a   |   bb |\n| :-- | ---: |\n| 1   | 2222 |");
  });

  it("pads ragged rows to the full column count", () => {
    const input = "|a|b|\n|-|-|\n|1|";
    expect(formatTablesText(input)).toBe("| a   | b   |\n| --- | --- |\n| 1   |     |");
  });

  it("leaves non-table text untouched", () => {
    const input = "# Title\n\nSome text\n- a list";
    expect(formatTablesText(input)).toBe(input);
  });

  it("formats a table embedded between prose", () => {
    const input = "intro\n\n|x|y|\n|-|-|\n|1|2|\n\noutro";
    expect(formatTablesText(input)).toBe(
      "intro\n\n| x   | y   |\n| --- | --- |\n| 1   | 2   |\n\noutro",
    );
  });
});
