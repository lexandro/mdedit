import { describe, it, expect } from "vitest";
import { filterEmoji, type Emoji } from "./emoji-search";

const list: Emoji[] = [
  { shortcode: "smile", char: "😄" },
  { shortcode: "smiley", char: "😃" },
  { shortcode: "sweat_smile", char: "😅" },
  { shortcode: "heart", char: "❤️" },
];

describe("filterEmoji", () => {
  it("ranks prefix matches above substring matches", () => {
    const out = filterEmoji("smile", list, 10).map((e) => e.shortcode);
    expect(out).toEqual(["smile", "smiley", "sweat_smile"]);
  });
  it("returns the head of the list for an empty query", () => {
    expect(filterEmoji("", list, 2)).toHaveLength(2);
  });
  it("respects the limit", () => {
    expect(filterEmoji("smile", list, 1)).toHaveLength(1);
  });
  it("returns nothing when no shortcode contains the query", () => {
    expect(filterEmoji("zzz", list)).toEqual([]);
  });
});
