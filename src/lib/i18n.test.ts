import { describe, it, expect, afterEach } from "vitest";
import { t } from "./i18n";
import { settings } from "./stores/settings.svelte";

afterEach(() => {
  settings.language = "en";
});

describe("t", () => {
  it("resolves English by default", () => {
    expect(t("cmd.new")).toBe("New");
  });
  it("resolves Hungarian when the language is hu", () => {
    settings.language = "hu";
    expect(t("cmd.new")).toBe("Új");
  });
  it("interpolates {param} placeholders", () => {
    expect(t("status.words", { n: 5 })).toBe("5 words");
  });
  it("falls back to the key for an unknown id", () => {
    expect(t("nope.nope")).toBe("nope.nope");
  });
});
