import { describe, it, expect } from "vitest";
import { isInlinableAssetUrl } from "./export-util";

describe("isInlinableAssetUrl", () => {
  it("matches Tauri-served local asset URLs", () => {
    expect(isInlinableAssetUrl("http://asset.localhost/C%3A%2Fpics%2Fx.png")).toBe(true);
    expect(isInlinableAssetUrl("https://asset.localhost/x.png")).toBe(true);
    expect(isInlinableAssetUrl("http://tauri.localhost/x.png")).toBe(true);
    expect(isInlinableAssetUrl("asset://localhost/x.png")).toBe(true);
  });
  it("leaves remote, data, and relative srcs alone", () => {
    expect(isInlinableAssetUrl("https://example.com/x.png")).toBe(false);
    expect(isInlinableAssetUrl("data:image/png;base64,AA")).toBe(false);
    expect(isInlinableAssetUrl("images/x.png")).toBe(false);
  });
});
