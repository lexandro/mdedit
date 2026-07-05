// Save an image pasted from the clipboard to disk and return the Markdown src
// to insert. For a saved document the image goes next to it (./images/…) with a
// relative path; for an untitled buffer it goes to the app data dir (absolute).
import { writeFile, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { dirname, toPosix, encodeMarkdownLinkPath } from "$lib/md-assets";

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
      const dir = `${dirname(docPath)}/images`;
      await mkdir(dir, { recursive: true });
      await writeFile(`${dir}/${name}`, bytes);
      return `images/${name}`; // relative to the document
    }
    // appDataDir() uses backslashes on Windows; markdown-it would percent-encode
    // them in the link, so insert a forward-slash path.
    const dir = `${toPosix(await appDataDir())}/pasted-images`;
    await mkdir(dir, { recursive: true });
    const abs = `${dir}/${name}`;
    await writeFile(abs, bytes);
    // Encode so a profile path with a space/paren (e.g. OneDrive-redirected
    // AppData) stays a single valid Markdown link destination.
    return encodeMarkdownLinkPath(abs); // absolute (untitled buffer has no folder of its own)
  } catch {
    return null;
  }
}
