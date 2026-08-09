// Dialogs and overlays are only ever shown on demand, so they are code-split
// out of the launch bundle. Declaring them here (rather than inline in
// +page.svelte) gives the prewarm queue something to warm up.
import { lazyComponent } from "$lib/lazy.svelte";

export const SettingsDialog = lazyComponent(() => import("./SettingsDialog.svelte"));
export const AboutDialog = lazyComponent(() => import("./AboutDialog.svelte"));
export const ChangelogDialog = lazyComponent(() => import("./ChangelogDialog.svelte"));
export const GoToLineDialog = lazyComponent(() => import("./GoToLineDialog.svelte"));
export const CommandPalette = lazyComponent(() => import("./CommandPalette.svelte"));
export const EmojiPicker = lazyComponent(() => import("./EmojiPicker.svelte"));
export const SnippetPicker = lazyComponent(() => import("./SnippetPicker.svelte"));
export const SnippetManagerDialog = lazyComponent(() => import("./SnippetManagerDialog.svelte"));
export const TemplatePicker = lazyComponent(() => import("./TemplatePicker.svelte"));
export const TableEditorDialog = lazyComponent(() => import("./TableEditorDialog.svelte"));

/** Cheapest first — the prewarm queue evaluates one per idle slot. */
export const dialogPreloads = [
  GoToLineDialog,
  AboutDialog,
  CommandPalette,
  TemplatePicker,
  SnippetPicker,
  TableEditorDialog,
  ChangelogDialog,
  SnippetManagerDialog,
  SettingsDialog,
  EmojiPicker, // pulls the full emoji dataset
];
