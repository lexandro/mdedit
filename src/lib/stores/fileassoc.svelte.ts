// Tracks whether mdedit is the OS handler for .md files and offers to register.
import { type Store } from "@tauri-apps/plugin-store";
import { tryLoadStore } from "$lib/stores/persist";
import { mdAssociationStatus, registerMdAssociation, type MdAssocStatus } from "$lib/ipc";
import { toasts } from "$lib/stores/toasts.svelte";
import { t } from "$lib/i18n";

class FileAssocStore {
  status = $state<MdAssocStatus | "unknown">("unknown");
  dismissed = $state(false);
  #store: Store | null = null;

  /** Proactive banner shows only when we're genuinely not the handler, once. */
  showPrompt = $derived(this.status === "unregistered" && !this.dismissed);

  async init() {
    this.#store = await tryLoadStore("fileassoc.json", { autoSave: true, defaults: {} });
    this.dismissed = (await this.#store?.get<boolean>("dismissed")) ?? false;
    this.status = await mdAssociationStatus();
  }

  async register() {
    try {
      await registerMdAssociation();
      this.status = await mdAssociationStatus();
      // Registered cleanly, or a hash-protected UserChoice still points elsewhere
      // (the user must finish in Windows settings) — either way, stop nagging.
      if (this.status === "registered") toasts.success(t("assoc.done"));
      else toasts.show(t("assoc.partial"), "info", 8000);
    } catch (e) {
      toasts.error(t("assoc.failed"), e);
    }
    await this.dismiss();
  }

  async dismiss() {
    this.dismissed = true;
    await this.#store?.set("dismissed", true);
  }
}

export const fileAssoc = new FileAssocStore();
