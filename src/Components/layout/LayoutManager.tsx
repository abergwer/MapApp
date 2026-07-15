import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { observer } from 'mobx-react-lite';
import Panel from '../common/Panel';
import { useStores } from '../../stores/StoreContext';
import * as layout from '../../styles/system-ui/layout.styles';

/** A panel that can be injected into the right WORKSPACE dock. */
export interface PanelDef {
  id: string;
  title: string;
  content: ReactNode;
  /** Optional element rendered on the right side of the panel header. */
  headerAction?: ReactNode;
  /** When true the panel is not rendered. */
  hidden?: boolean;
}

interface LayoutManagerProps {
  topBar: ReactNode;
  statusBar: ReactNode;
  /** Left tabbed panel (see LeftPanel). */
  leftNav: ReactNode;
  rightPanels: PanelDef[];
  /** Map area content. */
  children: ReactNode;
}

/** Right WORKSPACE dock: header + 2-column panel grid; arrow-only collapse. */
const WorkspaceDockImpl = ({ panels }: { panels: PanelDef[] }) => {
  const { uiVisibilityStore: ui } = useStores();
  const collapsed = ui.railCollapsed.right;
  const visible = panels.filter((p) => !p.hidden);

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
      <Box sx={layout.dockHeader}>
        Workspace
        <Tooltip title="Collapse workspace" arrow>
          <IconButton size="small" onClick={() => ui.toggleRail('right')} aria-label="Collapse workspace">
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={layout.dockGrid}>
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
 * WORKSPACE dock (declarative panel config), status bar.
 */
function LayoutManagerImpl({ topBar, statusBar, leftNav, rightPanels, children }: LayoutManagerProps) {
  const { uiVisibilityStore: ui } = useStores();
  return (
    <Box sx={layout.appGrid(ui.railCollapsed.left, ui.railCollapsed.right)}>
      {topBar}
      {leftNav}
      <Box component="main" sx={layout.mapArea}>
        {children}
      </Box>
      <WorkspaceDock panels={rightPanels} />
      {statusBar}
    </Box>
  );
}

export default observer(LayoutManagerImpl);
