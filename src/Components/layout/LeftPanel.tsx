import type { ComponentType, ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import type { LeftViewId } from '../../stores/UIVisibilityStore';
import * as layout from '../../styles/system-ui/layout.styles';

/** A view selectable from the left icon rail. */
export interface LeftPanelView {
  id: LeftViewId;
  title: string;
  /** Icon shown in the rail (reference design). */
  Icon: ComponentType<{ fontSize?: 'small' | 'inherit' }>;
  content: ReactNode;
}

/**
 * Left panel (reference design): a permanent vertical icon rail — one icon
 * per view — with the active view's content in a column beside it. Clicking
 * an icon opens its view; clicking the active view's icon again collapses
 * the content column down to just the rail.
 */
function LeftPanelImpl({ views }: { views: LeftPanelView[] }) {
  const { uiVisibilityStore: ui } = useStores();
  const collapsed = ui.railCollapsed.left;
  const active = views.find((v) => v.id === ui.activeLeftView) ?? views[0];

  const handleIcon = (id: LeftViewId) => {
    if (!collapsed && active.id === id) {
      ui.toggleRail('left'); // clicking the open view's icon closes the column
      return;
    }
    ui.setActiveLeftView(id); // switches view + expands
  };

  return (
    <Box component="aside" sx={layout.leftPanelRoot}>
      <Box sx={layout.leftIconRail}>
        {views.map((v) => (
          <Tooltip key={v.id} title={v.title} placement="right" arrow>
            <IconButton
              size="large"
              sx={layout.railIcon(!collapsed && v.id === active.id)}
              onClick={() => handleIcon(v.id)}
              aria-label={`Open ${v.title} view`}
            >
              <v.Icon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      {!collapsed && (
        <Box sx={layout.leftPanelContent}>
          <Box sx={layout.leftPanelHeader}>
            <Typography component="h2" sx={layout.viewTitle}>
              {active.title}
            </Typography>
          </Box>
          <Box sx={layout.leftPanelBody}>{active.content}</Box>
        </Box>
      )}
    </Box>
  );
}

export default observer(LeftPanelImpl);
