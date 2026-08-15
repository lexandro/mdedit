// In-app confirm prompts. A caller awaits `confirmDialog.ask(...)`;
// ConfirmDialog.svelte renders the pending request and resolves that promise
// with the answer. The OS dialog can only offer OK/Cancel in the system's own
// styling, so anything that needs an extra option (or our theme) asks here.
export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** A third answer sitting between confirm and cancel ("Don't save"). Closing
   *  a dirty tab needs it: save, discard and abandon are three outcomes, which
   *  is exactly what the OS dialog's two buttons could never express. */
  altLabel?: string;
  /** When set, a checkbox is offered and its state comes back as `checked`. */
  optionLabel?: string;
}

export type ConfirmChoice = "confirm" | "alt" | "cancel";

export interface ConfirmAnswer {
  choice: ConfirmChoice;
  checked: boolean;
}

interface Pending {
  request: ConfirmRequest;
  resolve: (answer: ConfirmAnswer) => void;
}

const DECLINED: ConfirmAnswer = { choice: "cancel", checked: false };

class ConfirmStore {
  #queue = $state<Pending[]>([]);

  /** The request to show, or null when nothing is pending. */
  current = $derived<ConfirmRequest | null>(this.#queue[0]?.request ?? null);

  /** Ask the user; resolves once the dialog answers. Requests queue instead of
   *  replacing one another, so a burst (a branch switch touching several open
   *  files) can never strand a caller's promise. */
  ask(request: ConfirmRequest): Promise<ConfirmAnswer> {
    return new Promise((resolve) => this.#queue.push({ request, resolve }));
  }

  answer(answer: ConfirmAnswer) {
    this.#queue.shift()?.resolve(answer);
  }

  cancel() {
    this.answer(DECLINED);
  }
}

export const confirmDialog = new ConfirmStore();
