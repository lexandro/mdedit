import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import SnippetPicker from "./SnippetPicker.svelte";
import { insertSnippet } from "$lib/editor-snippets";
import type { Snippet } from "$lib/snippets";

vi.mock("$lib/editor-snippets", () => ({
  insertSnippet: vi.fn(),
  snippetLabel: (s: Snippet) => s.label ?? s.id,
}));

describe("SnippetPicker", () => {
  it("filters by name and inserts the clicked snippet", async () => {
    const onClose = vi.fn();
    render(SnippetPicker, { props: { onClose } });

    await fireEvent.input(screen.getByPlaceholderText(/search snippets/i), {
      target: { value: "front" },
    });
    await fireEvent.click(screen.getByRole("option", { name: /frontmatter/i }));

    expect(insertSnippet).toHaveBeenCalledWith(expect.objectContaining({ id: "frontmatter" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("matches by /trigger and inserts the top match on Enter", async () => {
    const onClose = vi.fn();
    render(SnippetPicker, { props: { onClose } });

    const input = screen.getByPlaceholderText(/search snippets/i);
    await fireEvent.input(input, { target: { value: "/task" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(insertSnippet).toHaveBeenCalledWith(expect.objectContaining({ id: "task" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an empty state and closes on Escape", async () => {
    const onClose = vi.fn();
    render(SnippetPicker, { props: { onClose } });

    const input = screen.getByPlaceholderText(/search snippets/i);
    await fireEvent.input(input, { target: { value: "zzzzz" } });
    expect(screen.queryByText(/no matching snippet/i)).not.toBeNull();

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
