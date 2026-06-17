import { load, type Store } from "@tauri-apps/plugin-store";

/** Load a tauri-plugin-store file, returning null when not running under Tauri
 *  (so stores can transparently fall back to in-memory defaults). */
export async function tryLoadStore(
  file: string,
  options?: Parameters<typeof load>[1],
): Promise<Store | null> {
  try {
    return await load(file, options);
  } catch {
    return null;
  }
}
