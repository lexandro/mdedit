// Save an image pasted from the clipboard to disk and return the Markdown src
// to insert. For a saved document the image goes next to it (./images/…) with a
// relative path; for an untitled buffer it goes to the app data dir (absolute).
import { writeFile, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

function dirOf(path: string): string {
  const norm = path.replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  return i >= 0 ? norm.slice(0, i) : "";
}

function extFor(mime: string): string {
  const e = mime.split("/")[1]?.toLowerCase() ?? "png";
  return e === "jpeg" ? "jpg" : e.replace(/[^a-z0-9]/g, "") || "png";
}

/** Returns the src to put in `![](src)`, or null if it couldn't be saved. */
export async function savePastedImage(file: File, docPath: string | null): Promise<string | null> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = `pasted-${Date.now()}.${extFor(file.type)}`;
  try {
    if (docPath) {
      const dir = `${dirOf(docPath)}/images`;
      await mkdir(dir, { recursive: true });
      await writeFile(`${dir}/${name}`, bytes);
      return `images/${name}`; // relative to the document
    }
    const dir = `${await appDataDir()}/pasted-images`;
    await mkdir(dir, { recursive: true });
    const abs = `${dir}/${name}`;
    await writeFile(abs, bytes);
    return abs; // absolute (untitled buffer has no folder of its own)
  } catch {
    return null;
  }
}
