import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import type { LeftViewId } from '../../stores/UIVisibilityStore';
import * as layout from '../../styles/system-ui/layout.styles';

/** A view selectable from the left icon rail. */
export interface LeftNavView {
  id: LeftViewId;
  title: string;
  subtitle: string;
  icon: ReactNode;
  content: ReactNode;
}

/**
 * Left panel navigator (reference design): a slim always-visible icon rail
 * that switches the content column between views. The «-chevron collapses
 * the content column so the map widens; clicking any rail icon reopens it.
 */
function LeftNavImpl({ views }: { views: LeftNavView[] }) {
  const { uiVisibilityStore: ui } = useStores();
  const collapsed = ui.railCollapsed.left;
  const active = views.find((v) => v.id === ui.activeLeftView) ?? views[0];

  return (
    <Box component="aside" sx={layout.leftNavRoot}>
      <Box sx={layout.iconRail}>
        {views.map((v) => (
          <Tooltip key={v.id} title={v.title} placement="right" arrow>
            <IconButton
              size="small"
              sx={layout.railIcon(!collapsed && v.id === active.id)}
              onClick={() => ui.setActiveLeftView(v.id)}
              aria-label={`Open ${v.title} view`}
            >
              {v.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      {!collapsed && (
        <Box sx={layout.navContent}>
          <Box sx={layout.navContentHeader}>
            <Box>
              <Typography component="h2" sx={layout.viewTitle}>
                {active.title}
              </Typography>
              <Typography sx={layout.viewSubtitle}>{active.subtitle}</Typography>
            </Box>
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
          {active.content}
        </Box>
      )}
    </Box>
  );
}

export default observer(LeftNavImpl);
