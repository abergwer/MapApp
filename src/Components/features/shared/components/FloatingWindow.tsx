import { useCallback, useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { FloatRect } from '../../../../stores/WindowDockStore';
import controls from '../../../styles/mui/controls.module.css';
import styles from '../../../styles/shared/DockWindow.module.css';

export interface FloatingWindowProps {
  title: string;
  rect: FloatRect;
  zIndex: number;
  expanded: boolean;
  minWidth: number;
  minHeight: number;
  dockLabel?: string;
  closeLabel?: string;
  onFocus: () => void;
  onRectChange: (rect: FloatRect) => void;
  onExpandedChange: (expanded: boolean) => void;
  onDock: () => void;
  onClose: () => void;
  /** Called while dragging; parent can detect dock drop zone. */
  onDragMove?: (clientX: number, clientY: number) => void;
  onDragEnd?: (clientX: number, clientY: number) => void;
  children: ReactNode;
}

type DragMode = 'move' | 'resize';

/**
 * Floating window over the map: drag title bar, resize corner, dock / close.
 */
export default function FloatingWindow({
  title,
  rect,
  zIndex,
  expanded,
  minWidth,
  minHeight,
  dockLabel = 'Return to dock',
  closeLabel = 'Hide window',
  onFocus,
  onRectChange,
  onExpandedChange,
  onDock,
  onClose,
  onDragMove,
  onDragEnd,
  children,
}: FloatingWindowProps) {
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: FloatRect;
  } | null>(null);

  const onPointerDown = useCallback(
    (mode: DragMode) => (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onFocus();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      dragRef.current = {
        mode,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...rect },
      };
    },
    [onFocus, rect],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (drag.mode === 'move') {
        onRectChange({
          ...drag.origin,
          x: Math.max(0, drag.origin.x + dx),
          y: Math.max(0, drag.origin.y + dy),
        });
        onDragMove?.(event.clientX, event.clientY);
      } else {
        onRectChange({
          ...drag.origin,
          width: Math.max(minWidth, drag.origin.width + dx),
          height: Math.max(minHeight, drag.origin.height + dy),
        });
      }
    },
    [minHeight, minWidth, onDragMove, onRectChange],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current) return;
      const mode = dragRef.current.mode;
      dragRef.current = null;
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      if (mode === 'move') {
        onDragEnd?.(event.clientX, event.clientY);
      }
    },
    [onDragEnd],
  );

  return (
    <div
      className={styles.floatRoot}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: expanded ? rect.height : undefined,
        zIndex,
      }}
      onMouseDown={onFocus}
    >
      <div
        className={styles.floatTitleBar}
        onPointerDown={onPointerDown('move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <p className={styles.floatTitle}>{title}</p>
        <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
          <IconButton
            className={controls.panelCollapse}
            size="small"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onExpandedChange(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ExpandMoreIcon
              fontSize="inherit"
              style={{ transform: expanded ? undefined : 'rotate(-90deg)' }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title={dockLabel}>
          <IconButton
            className={controls.panelCollapse}
            size="small"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onDock}
            aria-label={dockLabel}
          >
            <PushPinIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title={closeLabel}>
          <IconButton
            className={controls.panelCollapse}
            size="small"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            aria-label={closeLabel}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </div>

      <div className={expanded ? styles.floatBody : styles.floatBodyCollapsed}>{children}</div>

      {expanded && (
        <div
          className={styles.resizeHandle}
          onPointerDown={onPointerDown('resize')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
