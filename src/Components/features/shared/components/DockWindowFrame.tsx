import type { ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CollapsiblePanelSection from './CollapsiblePanelSection';
import controls from '../../../styles/mui/controls.module.css';
import styles from '../../../styles/shared/DockWindow.module.css';

export interface DockWindowFrameProps {
  title: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose?: () => void;
  onUndock?: () => void;
  headerStartExtra?: ReactNode;
  headerEnd?: ReactNode;
  undockLabel?: string;
  closeLabel?: string;
  children: ReactNode;
}

/**
 * Docked window chrome: collapsible section + optional undock / close actions.
 * Reuses CollapsiblePanelSection (same pattern as Entities).
 */
export default function DockWindowFrame({
  title,
  expanded,
  onExpandedChange,
  onClose,
  onUndock,
  headerStartExtra,
  headerEnd,
  undockLabel = 'Undock to map',
  closeLabel = 'Hide window',
  children,
}: DockWindowFrameProps) {
  return (
    <CollapsiblePanelSection
      title={title}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      headerStartExtra={headerStartExtra}
      headerEnd={
        <div className={styles.headerActions}>
          {headerEnd}
          {onUndock && (
            <Tooltip title={undockLabel}>
              <IconButton
                className={controls.panelCollapse}
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onUndock();
                }}
                aria-label={undockLabel}
              >
                <OpenInNewIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title={closeLabel}>
              <IconButton
                className={controls.panelCollapse}
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                aria-label={closeLabel}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      }
    >
      {children}
    </CollapsiblePanelSection>
  );
}
