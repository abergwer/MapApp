import { makeAutoObservable } from 'mobx';

export type MessageSeverity = 'info' | 'error' | 'success' | 'warning';

export interface MessageOptions {
  title?: string;
  message: string;
  severity?: MessageSeverity;
  /**
   * Auto-dismiss the popup after this many milliseconds, so the user doesn't
   * need to click Close. Omit (or 0) to keep it open until closed manually.
   */
  autoHideMs?: number;
}

/**
 * Isolated, self-contained store for a single global message/error popup.
 *
 * It is a module-level singleton so it can be driven from *anywhere* —
 * React components, MobX stores, plain services, network callbacks — without
 * needing the store context. Just call:
 *
 *   showMessage('Something happened')
 *   showMessage({ title: 'Error', message: 'Failed to load', severity: 'error' })
 */
export class MessageDialogStore {
  open = false;
  title?: string;
  message = '';
  severity: MessageSeverity = 'info';

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  show(options: MessageOptions | string) {
    const opts: MessageOptions = typeof options === 'string' ? { message: options } : options;
    this.clearTimer();
    this.title = opts.title;
    this.message = opts.message;
    this.severity = opts.severity ?? 'info';
    this.open = true;

    if (opts.autoHideMs && opts.autoHideMs > 0) {
      this.hideTimer = setTimeout(() => this.close(), opts.autoHideMs);
    }
  }

  close() {
    this.clearTimer();
    this.open = false;
  }

  private clearTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}

export const messageDialogStore = new MessageDialogStore();

/** Show the global message popup from anywhere in the app. */
export function showMessage(options: MessageOptions | string) {
  messageDialogStore.show(options);
}
