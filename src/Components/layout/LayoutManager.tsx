import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { observer } from 'mobx-react-lite';
import Panel from '../common/Panel';
import FloatingPanelWindow from '../common/FloatingPanelWindow';
import { useStores } from '../../stores/StoreContext';
import type { WorkspacePanelId } from '../../stores/UIVisibilityStore';
import * as layout from './styles/layout.styles';

/** A panel that can be injected into the right WORKSPACE dock. */
export interface PanelDef {
  id: WorkspacePanelId;
  title: string;
  content: ReactNode;
  /** Content rendered when the panel floats/maximizes over the map.
   *  Falls back to `content` when omitted. */
  floatContent?: ReactNode;
  /** Optional element rendered on the right side of the panel header. */
  headerAction?: ReactNode;
  /** Extra buttons for the floating/maximized window header, rendered
   *  before the standard window actions (full view / dock / close). */
  floatHeaderAction?: ReactNode;
  /** When true the panel is not rendered. */
  hidden?: boolean;
}

interface LayoutManagerProps {
  topBar: ReactNode;
  /** Left tabbed panel (see LeftPanel). */
  leftNav: ReactNode;
  rightPanels: PanelDef[];
  /** Render floating/maximized panel windows over the map area. Default true. */
  showFloatingWindows?: boolean;
  /** Map area content. */
  children: ReactNode;
}

/** Right WORKSPACE dock: header + 2-column panel grid; arrow-only collapse.
 *  Dragging the left edge resizes the dock width (persisted in the store).
 *  With ≤1 docked panel the grid drops to a single column (and the shell
 *  halves the dock width — drag deltas are doubled so resizing stays 1:1). */
const WorkspaceDockImpl = ({ panels }: { panels: PanelDef[] }) => {
  const { uiVisibilityStore: ui } = useStores();
  const collapsed = ui.railCollapsed.right;
  const visible = panels.filter((p) => !p.hidden);
  const single = visible.length <= 1;

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = ui.rightDockWidth;
    // The store always holds the FULL (2-column) width; in single-column
    // mode the displayed width is half, so screen-drag deltas count double.
    const factor = single ? 2 : 1;
    const onMove = (ev: PointerEvent) =>
      ui.setRightDockWidth(startWidth + (startX - ev.clientX) * factor);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (collapsed) {
    return (
      <Box component="aside" sx={layout.collapsedRail('right')}>
        <Tooltip title="Expand workspace" placement="left" arrow>
          <IconButton
            size="small"
            sx={layout.navCollapseButton}
            onClick={() => ui.toggleRail('right')}
            aria-label="Expand workspace"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box component="aside" sx={layout.dockRoot}>
      <Box
        sx={layout.dockResizeHandle}
        onPointerDown={startResize}
        role="separator"
        aria-label="Resize workspace panel"
      />
      <Box sx={layout.dockHeader}>
        Workspace
        <Tooltip title="Collapse workspace" arrow>
          <IconButton size="small" onClick={() => ui.toggleRail('right')} aria-label="Collapse workspace">
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={layout.dockGrid(single)}>
        {visible.map((p) => (
          <Panel key={p.id} title={p.title} action={p.headerAction}>
            {p.content}
          </Panel>
        ))}
      </Box>
    </Box>
  );
};
const WorkspaceDock = observer(WorkspaceDockImpl);

/**
 * App shell: dashboard grid — top bar, tabbed left panel, map, right
 * WORKSPACE dock (declarative panel config), status bar. Panels whose mode
 * is floating/maximized render as windows over the map area (opt out with
 * `showFloatingWindows={false}`).
 */
function LayoutManagerImpl({
  topBar,
  leftNav,
  rightPanels,
  showFloatingWindows = true,
  children,
}: LayoutManagerProps) {
  const { uiVisibilityStore: ui } = useStores();
  // With ≤1 docked panel the dock shrinks to one column: half the stored
  // 2-column width (+ half the grid gap/padding so the panel keeps its size).
  const dockedCount = rightPanels.filter((p) => !p.hidden).length;
  const effectiveRightWidth =
    dockedCount <= 1 ? Math.round(ui.rightDockWidth / 2) + 4 : ui.rightDockWidth;
  return (
    <Box sx={layout.appGrid(ui.railCollapsed.left, ui.railCollapsed.right, effectiveRightWidth)}>
      {topBar}
      {leftNav}
      <Box component="main" sx={layout.mapArea}>
        {children}
        {showFloatingWindows &&
          rightPanels
            .filter((p) => ui.isPanelVisible(p.id) && ui.panels[p.id].mode !== 'docked')
            .map((p) => (
              <FloatingPanelWindow key={p.id} id={p.id} title={p.title} headerAction={p.floatHeaderAction}>
                {p.floatContent ?? p.content}
              </FloatingPanelWindow>
            ))}
      </Box>
      <WorkspaceDock panels={rightPanels} />
    </Box>
  );
}

export default observer(LayoutManagerImpl);
