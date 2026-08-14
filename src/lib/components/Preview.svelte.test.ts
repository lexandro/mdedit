import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import Preview from "./Preview.svelte";
import { toasts } from "$lib/stores/toasts.svelte";

// jsdom has no layout, so scrollIntoView is missing entirely.
const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

beforeEach(() => {
  scrollIntoView.mockClear();
  toasts.items = [];
});

async function mount(source: string) {
  const { container } = render(Preview, { props: { source } });
  await tick();
  return container;
}

describe("Preview — anchor links", () => {
  const doc = "# How it works\n\nSee [How it works](#how-it-works).\n";

  it("scrolls to the heading the link targets", async () => {
    const container = await mount(doc);
    const link = container.querySelector<HTMLAnchorElement>('a[href="#how-it-works"]')!;
    expect(container.querySelector("h1")!.id).toBe("how-it-works");
    link.click();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(container.querySelector("h1"));
  });

  it("resolves percent-encoded anchors (accented headings)", async () => {
    const container = await mount("# Áttekintés\n\n[x](#áttekintés)\n");
    const link = container.querySelector("a")!;
    expect(link.getAttribute("href")).not.toBe("#áttekintés"); // markdown-it encodes it
    link.click();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("reports a link that points at no heading instead of failing silently", async () => {
    const container = await mount("# Real\n\n[x](#missing)\n");
    container.querySelector("a")!.click();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(toasts.items.at(-1)?.message).toContain("missing");
  });

  it("leaves external links to the webview", async () => {
    const container = await mount("[x](https://example.com)\n");
    const link = container.querySelector("a")!;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
