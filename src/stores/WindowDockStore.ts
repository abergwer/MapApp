import { makeAutoObservable } from 'mobx';
import { workspaceDefaults } from '../config/workspaceDefaults';

export type DockWindowId = 'video' | 'minimap' | 'view3d' | 'intel';
export type WindowPlacement = 'docked' | 'floating';
export type RightWorkspaceLayout = 'hidden' | 'single' | 'double' | 'maximized';

export interface FloatRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DockWindowState {
  open: boolean;
  /** Used by floating chrome collapse only — not Right Workspace cards. */
  expanded: boolean;
  placement: WindowPlacement;
  floatRect: FloatRect | null;
}

const DEFAULT_DOCK_ORDER: DockWindowId[] = [...workspaceDefaults.dockOrder];
const DEFAULT_FLOAT = workspaceDefaults.float;

function defaultWindow(open: boolean): DockWindowState {
  return {
    open,
    expanded: true,
    placement: 'docked',
    floatRect: null,
  };
}

function buildDefaultWindows(): Record<DockWindowId, DockWindowState> {
  const open = workspaceDefaults.openByDefault;
  return {
    view3d: defaultWindow(open),
    video: defaultWindow(open),
    minimap: defaultWindow(open),
    intel: defaultWindow(open),
  };
}

/**
 * Right-side window dock: open/close, dock/float, grid order, maximize.
 * Initial open/dock state comes from config/workspaceDefaults.
 */
export class WindowDockStore {
  windows: Record<DockWindowId, DockWindowState> = buildDefaultWindows();

  /** Explicit dock grid order (source of truth for RightDockPanel). */
  dockOrder: DockWindowId[] = [...DEFAULT_DOCK_ORDER];

  /** When set, that docked window fills the entire right workspace grid. */
  maximizedId: DockWindowId | null = null;

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

  isMaximized(id: DockWindowId): boolean {
    return this.maximizedId === id && this.isDocked(id);
  }

  get(id: DockWindowId): DockWindowState {
    return this.windows[id];
  }

  get dockedIds(): DockWindowId[] {
    return this.dockOrder.filter((id) => this.isDocked(id));
  }

  get dockedCount(): number {
    return this.dockedIds.length;
  }

  /** Layout mode for AppShell right column width / grid columns. */
  get rightWorkspaceLayout(): RightWorkspaceLayout {
    if (this.maximizedId && this.isDocked(this.maximizedId)) return 'maximized';
    const n = this.dockedCount;
    if (n === 0) return 'hidden';
    if (n <= 2) return 'single';
    return 'double';
  }

  setOpen(id: DockWindowId, open: boolean) {
    this.windows[id].open = open;
    if (!open) {
      this.floatOrder = this.floatOrder.filter((w) => w !== id);
      if (this.maximizedId === id) this.maximizedId = null;
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

  maximize(id: DockWindowId) {
    if (!this.isDocked(id)) return;
    this.maximizedId = id;
  }

  restore() {
    this.maximizedId = null;
  }

  toggleMaximize(id: DockWindowId) {
    if (this.maximizedId === id) {
      this.restore();
    } else {
      this.maximize(id);
    }
  }

  /** Swap two docked windows in dockOrder. */
  swapDockOrder(a: DockWindowId, b: DockWindowId) {
    if (a === b) return;
    const i = this.dockOrder.indexOf(a);
    const j = this.dockOrder.indexOf(b);
    if (i < 0 || j < 0) return;
    const next = [...this.dockOrder];
    next[i] = b;
    next[j] = a;
    this.dockOrder = next;
  }

  setDockOrder(order: DockWindowId[]) {
    const unique = order.filter((id, index) => order.indexOf(id) === index);
    const missing = DEFAULT_DOCK_ORDER.filter((id) => !unique.includes(id));
    this.dockOrder = [...unique, ...missing];
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
    if (this.maximizedId === id) this.maximizedId = null;
    this.bringToFront(id);
  }

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
