// Thin wrappers around Tauri's dialog + fs plugins so the rest of the app
// never imports the plugin packages directly. Keeps file I/O in one place.
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export type LineEnding = "lf" | "crlf";

export interface LoadedFile {
  path: string;
  content: string; // normalized to LF for the editor
  lineEnding: LineEnding;
  hadBom: boolean;
}

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "mdx"] },
  { name: "Text", extensions: ["txt"] },
  { name: "All Files", extensions: ["*"] },
];

/** Detect the dominant line ending so we can preserve it on save. */
function detectLineEnding(raw: string): LineEnding {
  const crlf = (raw.match(/\r\n/g) ?? []).length;
  const lf = (raw.match(/(?<!\r)\n/g) ?? []).length;
  return crlf > lf ? "crlf" : "lf";
}

/** Show an open dialog and read the chosen file. Returns null if cancelled. */
export async function pickAndReadFile(): Promise<LoadedFile | null> {
  const selected = await openDialog({ multiple: false, filters: MD_FILTERS });
  if (typeof selected !== "string") return null;
  return readFile(selected);
}

export async function readFile(path: string): Promise<LoadedFile> {
  let content = await readTextFile(path);
  const hadBom = content.charCodeAt(0) === 0xfeff;
  if (hadBom) content = content.slice(1);
  const lineEnding = detectLineEnding(content);
  // Normalize to LF for the editor; we re-apply the original ending on save.
  content = content.replace(/\r\n/g, "\n");
  return { path, content, lineEnding, hadBom };
}

export interface SaveOptions {
  lineEnding: LineEnding;
  bom?: boolean;
}

/** Write editor content (LF-normalized) back to disk with the desired ending. */
export async function writeFile(path: string, content: string, opts: SaveOptions): Promise<void> {
  let out = content.replace(/\r\n/g, "\n");
  if (opts.lineEnding === "crlf") out = out.replace(/\n/g, "\r\n");
  if (opts.bom) out = "﻿" + out;
  await writeTextFile(path, out);
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
