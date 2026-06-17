// Thin wrappers around Tauri's dialog + fs plugins so the rest of the app
// never imports the plugin packages directly. Keeps file I/O in one place.
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readFile as fsReadFile, writeFile as fsWriteFile } from "@tauri-apps/plugin-fs";
import {
  decodeBytes,
  encodeText,
  detectLineEnding,
  applyLineEnding,
  type Encoding,
  type LineEnding,
} from "$lib/encoding";

export type { Encoding, LineEnding } from "$lib/encoding";

export interface LoadedFile {
  path: string;
  content: string; // normalized to LF for the editor
  lineEnding: LineEnding;
  encoding: Encoding;
}

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "mdx"] },
  { name: "Text", extensions: ["txt"] },
  { name: "All Files", extensions: ["*"] },
];

/** Show an open dialog and read the chosen file. Returns null if cancelled. */
export async function pickAndReadFile(): Promise<LoadedFile | null> {
  const selected = await openDialog({ multiple: false, filters: MD_FILTERS });
  if (typeof selected !== "string") return null;
  return readFile(selected);
}

export async function readFile(path: string): Promise<LoadedFile> {
  const bytes = await fsReadFile(path);
  const { content: raw, encoding } = decodeBytes(bytes);
  const lineEnding = detectLineEnding(raw);
  // Normalize to LF for the editor; the original ending is re-applied on save.
  return { path, content: raw.replace(/\r\n/g, "\n"), lineEnding, encoding };
}

export interface SaveOptions {
  lineEnding: LineEnding;
  encoding: Encoding;
}

/** Write editor content (LF-normalized) back to disk in the given encoding. */
export async function writeFile(path: string, content: string, opts: SaveOptions): Promise<void> {
  const text = applyLineEnding(content, opts.lineEnding);
  await fsWriteFile(path, encodeText(text, opts.encoding));
}

/** Show a save dialog, returning the chosen path (or null if cancelled). */
export async function pickSavePath(defaultName?: string): Promise<string | null> {
  const path = await saveDialog({ filters: MD_FILTERS, defaultPath: defaultName });
  return path ?? null;
}

/** Start/stop watching a file for external changes (best-effort). */
export async function watchFile(path: string): Promise<void> {
  try {
    await invoke("watch_file", { path });
  } catch {
    /* not under Tauri, or already watched */
  }
}

export async function unwatchFile(path: string): Promise<void> {
  try {
    await invoke("unwatch_file", { path });
  } catch {
    /* ignore */
  }
}

/** Files this instance was launched with (e.g. via "Open with"); consumed once. */
export async function takeLaunchFiles(): Promise<string[]> {
  try {
    return await invoke<string[]>("take_launch_files");
  } catch {
    return []; // not under Tauri
  }
}

/** Loose path comparison tolerant of separator and extended-length differences. */
export function samePath(a: string, b: string): boolean {
  const norm = (p: string) =>
    p
      .replace(/^\\\\\?\\/, "")
      .replace(/\\/g, "/")
      .toLowerCase();
  return norm(a) === norm(b);
}
