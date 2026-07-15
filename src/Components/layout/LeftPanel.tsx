import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import type { LeftViewId } from '../../stores/UIVisibilityStore';
import * as layout from '../../styles/system-ui/layout.styles';

/** A view selectable from the left panel's pill tabs. */
export interface LeftPanelView {
  id: LeftViewId;
  title: string;
  content: ReactNode;
}

/**
 * Left panel (reference design): header row with the active view title and
 * segmented pill tabs, «-arrow collapses the whole panel — the collapsed
 * state shows ONLY the expand arrow.
 */
function LeftPanelImpl({ views }: { views: LeftPanelView[] }) {
  const { uiVisibilityStore: ui } = useStores();
  const collapsed = ui.railCollapsed.left;
  const active = views.find((v) => v.id === ui.activeLeftView) ?? views[0];

  if (collapsed) {
    return (
      <Box component="aside" sx={layout.collapsedRail('left')}>
        <Tooltip title="Expand panel" placement="right" arrow>
          <IconButton
            size="small"
            sx={layout.navCollapseButton}
            onClick={() => ui.toggleRail('left')}
            aria-label="Expand left panel"
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box component="aside" sx={layout.leftPanelRoot}>
      <Box sx={{ ...layout.railToggleRow('left'), p: 0.5, pb: 0 }}>
        <Tooltip title="Collapse panel" arrow>
          <IconButton
            size="small"
            sx={layout.navCollapseButton}
            onClick={() => ui.toggleRail('left')}
            aria-label="Collapse left panel"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={layout.leftPanelHeader}>
        <Typography component="h2" sx={layout.viewTitle}>
          {active.title}
        </Typography>
        <Box sx={layout.pillTabs}>
          {views.map((v) => (
            <ButtonBase
              key={v.id}
              sx={layout.pillTab(v.id === active.id)}
              onClick={() => ui.setActiveLeftView(v.id)}
              aria-label={`Open ${v.title} view`}
            >
              {v.title}
            </ButtonBase>
          ))}
        </Box>
      </Box>

      <Box sx={layout.leftPanelBody}>{active.content}</Box>
    </Box>
  );
}

export default observer(LeftPanelImpl);
