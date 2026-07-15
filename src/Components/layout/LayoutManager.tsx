import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { observer } from 'mobx-react-lite';
import Panel from '../common/Panel';
import { useStores } from '../../stores/StoreContext';
import type { RailSide } from '../../stores/UIVisibilityStore';
import * as layout from '../../styles/system-ui/layout.styles';

/** A panel that can be injected into one of the side rails. */
export interface PanelDef {
  id: string;
  title: string;
  /** Shown in the collapsed rail's icon strip. */
  icon: ReactNode;
  content: ReactNode;
  /** Optional element rendered on the right side of the panel header. */
  headerAction?: ReactNode;
  /** When true the panel (and its strip icon) is not rendered. */
  hidden?: boolean;
}

interface LayoutManagerProps {
  topBar: ReactNode;
  statusBar: ReactNode;
  /** Left icon-rail navigator (see LeftNav). */
  leftNav: ReactNode;
  rightPanels: PanelDef[];
  /** Map area content. */
  children: ReactNode;
}

const RailImpl = ({ side, panels }: { side: RailSide; panels: PanelDef[] }) => {
  const { uiVisibilityStore: ui } = useStores();
  const collapsed = ui.railCollapsed[side];
  const visible = panels.filter((p) => !p.hidden);

  // Chevron points toward the map edge the rail collapses to.
  const collapseIcon = side === 'left' ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />;
  const expandIcon = side === 'left' ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />;

  return (
    <Box component="aside" sx={side === 'left' ? layout.leftRail : layout.rightRail}>
      <Box sx={layout.railToggleRow(side)}>
        <Tooltip title={collapsed ? 'Expand panels' : 'Collapse panels'} arrow>
          <IconButton
            size="small"
            sx={layout.railIcon(false)}
            onClick={() => ui.toggleRail(side)}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${side} panels`}
          >
            {collapsed ? expandIcon : collapseIcon}
          </IconButton>
        </Tooltip>
      </Box>

      {collapsed ? (
        <Box sx={layout.railIconStrip}>
          {visible.map((p) => (
            <Tooltip key={p.id} title={p.title} placement={side === 'left' ? 'right' : 'left'} arrow>
              <IconButton
                size="small"
                sx={layout.railIcon(false)}
                onClick={() => ui.expandRail(side)}
                aria-label={`Expand ${p.title} panel`}
              >
                {p.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      ) : (
        visible.map((p) => (
          <Panel key={p.id} title={p.title} action={p.headerAction}>
            {p.content}
          </Panel>
        ))
      )}
    </Box>
  );
};
const Rail = observer(RailImpl);

/**
 * App shell: renders the dashboard grid from a declarative panel config so
 * new panels can be injected without touching the layout. The left side is
 * an icon-rail navigator (LeftNav); the right rail collapses to icons.
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
      <Rail side="right" panels={rightPanels} />
      {statusBar}
    </Box>
  );
}

export default observer(LayoutManagerImpl);
