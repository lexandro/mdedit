// Update checking via tauri-plugin-updater. Auto-checks periodically and only
// *offers* an update (never downloads unattended); the user installs on demand.
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const SIX_HOURS = 6 * 60 * 60 * 1000;

type Status = "idle" | "checking" | "downloading" | "uptodate" | "error";

class UpdaterStore {
  // The pending update is held outside $state so Svelte's proxy can't wrap the
  // plugin object and break its methods; the version drives reactivity instead.
  #update: Update | null = null;
  availableVersion = $state<string | null>(null);
  status = $state<Status>("idle");
  message = $state("");
  dismissed = $state(false);

  /** Check for an update. `manual` shows up-to-date/error feedback; auto checks stay quiet. */
  async check(manual = false) {
    if (this.status === "checking" || this.status === "downloading") return;
    this.status = "checking";
    this.message = "";
    try {
      const update = await check();
      if (update) {
        this.#update = update;
        this.availableVersion = update.version;
        this.dismissed = false;
        this.status = "idle";
      } else {
        this.#update = null;
        this.availableVersion = null;
        this.status = manual ? "uptodate" : "idle";
        if (manual) setTimeout(() => this.status === "uptodate" && (this.status = "idle"), 3000);
      }
    } catch (e) {
      this.status = "error";
      this.message = e instanceof Error ? e.message : String(e);
      if (!manual) setTimeout(() => this.status === "error" && (this.status = "idle"), 4000);
    }
  }

  /** Download + install the offered update, then relaunch (user-initiated only). */
  async install() {
    if (!this.#update) return;
    this.status = "downloading";
    try {
      await this.#update.downloadAndInstall();
      await relaunch();
    } catch (e) {
      this.status = "error";
      this.message = e instanceof Error ? e.message : String(e);
    }
  }

  dismiss() {
    this.dismissed = true;
  }

  /** Start a delayed first check and a periodic background check. */
  startAutoCheck() {
    setTimeout(() => void this.check(false), 5000);
    setInterval(() => void this.check(false), SIX_HOURS);
  }
}

export const updater = new UpdaterStore();
