import { describe, it, expect } from "vitest";
import { spellcheckAttrs } from "./spell-util";

describe("spellcheckAttrs", () => {
  it("disables spellcheck when off (regardless of lang)", () => {
    expect(spellcheckAttrs(false, "en")).toEqual({ spellcheck: "false" });
  });
  it("enables with a language hint", () => {
    expect(spellcheckAttrs(true, "hu")).toEqual({ spellcheck: "true", lang: "hu" });
  });
  it("omits lang when empty so the WebView uses the system dictionary", () => {
    expect(spellcheckAttrs(true, "")).toEqual({ spellcheck: "true" });
  });
});
