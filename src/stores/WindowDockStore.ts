import { makeAutoObservable } from 'mobx';

export type DockWindowId = 'video' | 'minimap';
export type WindowPlacement = 'docked' | 'floating';

export interface FloatRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DockWindowState {
  /** Shown in the dock stack or as a floating window. */
  open: boolean;
  /** Collapsible body (like Entities sections). */
  expanded: boolean;
  placement: WindowPlacement;
  /** Only used while floating; cleared on redock. */
  floatRect: FloatRect | null;
}

const DEFAULT_FLOAT = { width: 320, height: 220 } as const;

function defaultWindow(open: boolean): DockWindowState {
  return {
    open,
    expanded: true,
    placement: 'docked',
    floatRect: null,
  };
}

/**
 * Right-side window dock: multiple windows can be open at once (stacked),
 * each collapsible. Video (and future windows) can undock to float over the map.
 */
export class WindowDockStore {
  windows: Record<DockWindowId, DockWindowState> = {
    video: defaultWindow(true),
    minimap: defaultWindow(true),
  };

  /** Front-most floating window last. */
  floatOrder: DockWindowId[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  isOpen(id: DockWindowId): boolean {
    return this.windows[id].open;
  }

  isExpanded(id: DockWindowId): boolean {
    return this.windows[id].expanded;
  }

  isFloating(id: DockWindowId): boolean {
    return this.windows[id].open && this.windows[id].placement === 'floating';
  }

  isDocked(id: DockWindowId): boolean {
    return this.windows[id].open && this.windows[id].placement === 'docked';
  }

  get(id: DockWindowId): DockWindowState {
    return this.windows[id];
  }

  setOpen(id: DockWindowId, open: boolean) {
    this.windows[id].open = open;
    if (!open) {
      this.floatOrder = this.floatOrder.filter((w) => w !== id);
    } else if (this.windows[id].placement === 'floating') {
      this.bringToFront(id);
    }
  }

  toggleOpen(id: DockWindowId) {
    this.setOpen(id, !this.windows[id].open);
  }

  setExpanded(id: DockWindowId, expanded: boolean) {
    this.windows[id].expanded = expanded;
  }

  undock(id: DockWindowId, rect?: Partial<FloatRect>) {
    const win = this.windows[id];
    win.open = true;
    win.placement = 'floating';
    win.expanded = true;
    win.floatRect = {
      x: rect?.x ?? 48,
      y: rect?.y ?? 48,
      width: rect?.width ?? DEFAULT_FLOAT.width,
      height: rect?.height ?? DEFAULT_FLOAT.height,
    };
    this.bringToFront(id);
  }

  /** Return to dock — original dock size (no floatRect). */
  dock(id: DockWindowId) {
    const win = this.windows[id];
    win.placement = 'docked';
    win.floatRect = null;
    win.open = true;
    this.floatOrder = this.floatOrder.filter((w) => w !== id);
  }

  setFloatRect(id: DockWindowId, rect: FloatRect) {
    if (this.windows[id].placement !== 'floating') return;
    this.windows[id].floatRect = rect;
  }

  bringToFront(id: DockWindowId) {
    this.floatOrder = this.floatOrder.filter((w) => w !== id);
    this.floatOrder.push(id);
  }

  floatZIndex(id: DockWindowId, base = 1200): number {
    const index = this.floatOrder.indexOf(id);
    return base + (index < 0 ? 0 : index + 1);
  }
}