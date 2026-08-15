import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, beforeEach } from "vitest";
import { tick } from "svelte";
import ConfirmDialog from "./ConfirmDialog.svelte";
import { confirmDialog, type ConfirmRequest } from "$lib/stores/confirm.svelte";

const REQUEST: ConfirmRequest = {
  title: "File changed on disk",
  message: '"note.md" was modified by another program.\nReload it?',
  confirmLabel: "Reload",
  cancelLabel: "Keep mine",
  optionLabel: "Don't ask again",
};

const box = () => screen.getByRole<HTMLInputElement>("checkbox");

/** Wrapped in an object: returning the pending promise from an async helper
 *  would make the helper itself wait for the user's answer. */
async function ask(request: ConfirmRequest = REQUEST) {
  const answered = confirmDialog.ask(request);
  await tick();
  return { answered };
}

beforeEach(() => {
  render(ConfirmDialog);
});

describe("ConfirmDialog", () => {
  it("shows nothing until something asks", () => {
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("reports the ticked option along with the confirmation", async () => {
    const { answered } = await ask();
    expect(screen.getByRole("alertdialog").textContent).toContain("note.md");

    await fireEvent.click(box());
    await fireEvent.click(screen.getByText("Reload"));

    await expect(answered).resolves.toEqual({ confirmed: true, checked: true });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("cancels on Escape without enabling the option", async () => {
    const { answered } = await ask();
    await fireEvent.click(box());
    await fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    await expect(answered).resolves.toEqual({ confirmed: false, checked: false });
  });

  it("confirms on Enter and focuses the confirm button", async () => {
    const { answered } = await ask();
    expect(document.activeElement).toBe(screen.getByText("Reload"));
    await fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Enter" });
    await expect(answered).resolves.toEqual({ confirmed: true, checked: false });
  });

  it("hides the checkbox for a request that offers no option", async () => {
    const { answered } = await ask({ ...REQUEST, optionLabel: undefined });
    expect(screen.queryByRole("checkbox")).toBeNull();
    confirmDialog.cancel();
    await expect(answered).resolves.toEqual({ confirmed: false, checked: false });
  });

  // A ticked box must not leak into the next file's prompt.
  it("starts the next request unticked", async () => {
    const { answered: first } = await ask();
    const second = confirmDialog.ask(REQUEST);
    await fireEvent.click(box());
    await fireEvent.click(screen.getByText("Reload"));
    await expect(first).resolves.toEqual({ confirmed: true, checked: true });

    await tick();
    expect(box().checked).toBe(false);
    confirmDialog.cancel();
    await expect(second).resolves.toEqual({ confirmed: false, checked: false });
  });
});
