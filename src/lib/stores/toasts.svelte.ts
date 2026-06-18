// Transient notifications (errors / success / info) so failed operations are
// never silent. Rendered by Toasts.svelte.
import { errorMessage } from "$lib/errors";

export type ToastKind = "error" | "success" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextId = 1;

class ToastStore {
  items = $state<Toast[]>([]);

  show(message: string, kind: ToastKind = "info", ms = kind === "error" ? 6000 : 3000): number {
    const id = nextId++;
    this.items.push({ id, kind, message });
    if (ms > 0) setTimeout(() => this.dismiss(id), ms);
    return id;
  }

  /** Show an error, optionally appending the cause's message. */
  error(message: string, cause?: unknown) {
    this.show(cause === undefined ? message : `${message}: ${errorMessage(cause)}`, "error");
  }

  success(message: string) {
    this.show(message, "success");
  }

  dismiss(id: number) {
    this.items = this.items.filter((t) => t.id !== id);
  }
}

export const toasts = new ToastStore();
