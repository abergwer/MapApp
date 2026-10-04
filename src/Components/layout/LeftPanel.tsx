import type { ComponentType, ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import type { LeftViewId } from '../../stores/UIVisibilityStore';
import * as layout from './styles/layout.styles';

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

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = ui.leftPanelWidth;
    const onMove = (ev: PointerEvent) => ui.setLeftPanelWidth(startWidth + (ev.clientX - startX));
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
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
        <Box sx={layout.leftPanelContent(ui.leftPanelWidth)}>
          <Box sx={layout.leftPanelHeader}>
            <Typography component="h2" sx={layout.viewTitle}>
              {active.title}
            </Typography>
            {!ui.leftPanelWidthIsDefault && (
              <Tooltip title="Reset panel width" arrow>
                <IconButton size="small" onClick={() => ui.resetLeftPanelWidth()} aria-label="Reset panel width">
                  <RestartAltIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box sx={layout.leftPanelBody}>{active.content}</Box>
          <Box
            sx={layout.leftPanelResizeHandle}
            onPointerDown={startResize}
            role="separator"
            aria-label={`Resize ${active.title} view`}
          />
        </Box>
      )}
    </Box>
  );
}

export default observer(LeftPanelImpl);
