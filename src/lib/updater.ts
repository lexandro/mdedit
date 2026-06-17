// In-app auto-update via tauri-plugin-updater. Checks the configured endpoint,
// downloads + installs a newer signed release, then relaunches.
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "none" }
  | { kind: "downloading"; version: string }
  | { kind: "ready"; version: string }
  | { kind: "error"; message: string };

export async function runUpdateCheck(set: (s: UpdateStatus) => void): Promise<void> {
  set({ kind: "checking" });
  try {
    const update = await check();
    if (!update) {
      set({ kind: "none" });
      return;
    }
    set({ kind: "downloading", version: update.version });
    await update.downloadAndInstall();
    set({ kind: "ready", version: update.version });
    await relaunch();
  } catch (e) {
    set({ kind: "error", message: e instanceof Error ? e.message : String(e) });
  }
}
