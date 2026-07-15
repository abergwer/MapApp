import type { ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../../../styles/shared/WorkspaceCard.module.css';

export interface WorkspaceCardProps {
  title: string;
  status?: ReactNode;
  maximized?: boolean;
  /** When true, header acts as HTML5 drag handle (not action buttons). */
  draggable?: boolean;
  dragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMaximize?: () => void;
  onUndock?: () => void;
  onClose?: () => void;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function WorkspaceCard({
  title,
  status,
  maximized = false,
  draggable = false,
  dragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onMaximize,
  onUndock,
  onClose,
  footer,
  children,
  className,
}: WorkspaceCardProps) {
  const rootClass = [
    styles.card,
    maximized ? styles.maximized : '',
    dragOver ? styles.dragOver : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={rootClass}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header
        className={[styles.header, draggable ? styles.headerDraggable : '']
          .filter(Boolean)
          .join(' ')}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className={styles.headerStart}>
          <h3 className={styles.title}>{title}</h3>
          {status}
        </div>
        <div
          className={styles.actions}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          draggable={false}
        >
          {onMaximize && (
            <Tooltip title={maximized ? 'Restore' : 'Maximize'}>
              <button
                type="button"
                className={styles.actionBtn}
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation();
                  onMaximize();
                }}
                aria-label={maximized ? 'Restore' : 'Maximize'}
              >
                {maximized ? (
                  <CloseFullscreenIcon sx={{ fontSize: 14 }} />
                ) : (
                  <OpenInFullIcon sx={{ fontSize: 14 }} />
                )}
              </button>
            </Tooltip>
          )}
          {onUndock && (
            <Tooltip title="Undock">
              <button
                type="button"
                className={styles.actionBtn}
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation();
                  onUndock();
                }}
                aria-label="Undock"
              >
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </button>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title="Close">
              <button
                type="button"
                className={styles.actionBtn}
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close"
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </button>
            </Tooltip>
          )}
        </div>
      </header>
      <div className={styles.body}>{children}</div>
      {footer != null && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}
