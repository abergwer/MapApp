import { useState, type CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import Stack from '@mui/material/Stack';
import { useStores } from '../../../../stores/StoreContext';
import type { DockWindowId } from '../../../../stores/WindowDockStore';
import {
  getDockWindowConfig,
  rightDockConfig,
  type RightDockWindowConfig,
} from '../config/rightDock.config';
import WorkspaceCard from '../../shared/components/WorkspaceCard';
import StatusBullet from '../../shared/components/StatusBullet';
import MiniMap from './MiniMap';
import MiniVideo from './MiniVideo';
import IntelFeedPanel from './IntelFeedPanel';
import View3DPanel from './View3DPanel';
import overlays from '../../../styles/live-view/overlays.module.css';
import dockStyles from '../../../styles/shared/DockWindow.module.css';
import cardStyles from '../../../styles/shared/WorkspaceCard.module.css';
import styles from '../../../styles/live-view/RightWorkspace.module.css';

const DND_MIME = 'application/x-mapapp-dock-window';

function dockChromeStyle(): CSSProperties {
  const { layout, card, overlays: ov } = rightDockConfig;
  return {
    '--dock-workspace-padding': `${layout.workspacePadding}px`,
    '--dock-grid-gap': `${layout.gridGap}px`,
    '--dock-card-header-h': `${card.headerHeight}px`,
    '--dock-action-size': `${card.actionSize}px`,
    '--dock-crosshair-size': `${ov.crosshairSize}px`,
    '--dock-corner-inset': `${ov.cornerInset}px`,
    '--dock-bracket-size': `${ov.bracketSize}px`,
  } as CSSProperties;
}

function VideoFooter() {
  return (
    <>
      <Tooltip title="Play / Pause">
        <span className={cardStyles.footerBtn} aria-label="Play / Pause">
          <PlayArrowIcon sx={{ fontSize: 16 }} />
        </span>
      </Tooltip>
      <Tooltip title="Record">
        <span className={cardStyles.footerBtn} aria-label="Record">
          <FiberManualRecordIcon sx={{ fontSize: 14, color: 'var(--app-color-danger)' }} />
        </span>
      </Tooltip>
      <Tooltip title="Snapshot">
        <span className={cardStyles.footerBtn} aria-label="Snapshot">
          <CameraAltOutlinedIcon sx={{ fontSize: 15 }} />
        </span>
      </Tooltip>
      <Tooltip title="Settings">
        <span className={cardStyles.footerBtn} aria-label="Settings">
          <SettingsOutlinedIcon sx={{ fontSize: 15 }} />
        </span>
      </Tooltip>
      <Tooltip title="Fullscreen">
        <span className={cardStyles.footerBtn} aria-label="Fullscreen">
          <FullscreenIcon sx={{ fontSize: 15 }} />
        </span>
      </Tooltip>
    </>
  );
}

function WindowBody({
  id,
  cfg,
  onLiveChange,
}: {
  id: DockWindowId;
  cfg: RightDockWindowConfig;
  onLiveChange?: (live: boolean) => void;
}) {
  if (id === 'video') {
    return (
      <div className={cardStyles.mediaFill}>
        <MiniVideo
          onStatusChange={(status, error) =>
            onLiveChange?.(status === 'live' && !error)
          }
        />
        <Stack className={overlays.videoOverlay} aria-hidden="true">
          {cfg.showCrosshair && <div className={overlays.crosshair} />}
          {cfg.showCornerFrame && (
            <div className={overlays.cornerFrame}>
              <span className={overlays.cornerTopLeft} />
              <span className={overlays.cornerTopRight} />
              <span className={overlays.cornerBottomLeft} />
              <span className={overlays.cornerBottomRight} />
            </div>
          )}
        </Stack>
      </div>
    );
  }

  if (id === 'minimap') {
    return (
      <div className={cardStyles.mediaFill}>
        <MiniMap />
      </div>
    );
  }

  if (id === 'view3d') {
    return (
      <div className={cardStyles.mediaFill}>
        <View3DPanel />
      </div>
    );
  }

  return <IntelFeedPanel />;
}

function WorkspaceCell({
  id,
  dragOverId,
  onDragOverId,
}: {
  id: DockWindowId;
  dragOverId: DockWindowId | null;
  onDragOverId: (id: DockWindowId | null) => void;
}) {
  const { windowDockStore } = useStores();
  const cfg = getDockWindowConfig(id);
  const [videoLive, setVideoLive] = useState(false);

  if (!cfg?.enabled || !windowDockStore.isDocked(id)) return null;

  const maximized = windowDockStore.isMaximized(id);
  const layout = windowDockStore.rightWorkspaceLayout;

  return (
    <div
      className={[styles.cell, maximized ? styles.cellMaximized : '']
        .filter(Boolean)
        .join(' ')}
    >
      <WorkspaceCard
        title={cfg.title}
        maximized={maximized}
        draggable={layout !== 'maximized'}
        dragOver={dragOverId === id}
        onDragStart={(e) => {
          e.dataTransfer.setData(DND_MIME, id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => onDragOverId(null)}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(DND_MIME)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOverId(id);
        }}
        onDragLeave={() => {
          if (dragOverId === id) onDragOverId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const source = e.dataTransfer.getData(DND_MIME) as DockWindowId;
          onDragOverId(null);
          if (source && source !== id) {
            windowDockStore.swapDockOrder(source, id);
          }
        }}
        status={
          cfg.showLiveBadge ? (
            <span className={cardStyles.liveBadge}>
              <StatusBullet tone={videoLive ? 'live' : 'off'} size="sm" />
              {videoLive ? rightDockConfig.labels.live : '—'}
            </span>
          ) : undefined
        }
        onMaximize={() => windowDockStore.toggleMaximize(id)}
        onUndock={
          cfg.canFloat
            ? () =>
                windowDockStore.undock(id, {
                  width: rightDockConfig.floating.defaultWidth,
                  height: rightDockConfig.floating.defaultHeight,
                })
            : undefined
        }
        onClose={() => windowDockStore.setOpen(id, false)}
        footer={id === 'video' ? <VideoFooter /> : undefined}
      >
        <WindowBody id={id} cfg={cfg} onLiveChange={setVideoLive} />
      </WorkspaceCard>
    </div>
  );
}

const WorkspaceCellObserved = observer(WorkspaceCell);

interface RightDockPanelProps {
  dropActive?: boolean;
  dockPanelRef?: React.Ref<HTMLDivElement>;
}

function RightDockPanelImpl({ dropActive = false, dockPanelRef }: RightDockPanelProps) {
  const { windowDockStore } = useStores();
  const [dragOverId, setDragOverId] = useState<DockWindowId | null>(null);
  const layout = windowDockStore.rightWorkspaceLayout;
  const maximizedId = windowDockStore.maximizedId;

  const visibleIds =
    layout === 'maximized' && maximizedId && windowDockStore.isDocked(maximizedId)
      ? [maximizedId]
      : windowDockStore.dockedIds;

  const gridClass =
    layout === 'single'
      ? styles.gridSingle
      : layout === 'maximized'
        ? styles.gridMaximized
        : styles.gridDouble;

  if (visibleIds.length === 0) {
    return (
      <div
        ref={dockPanelRef}
        className={dropActive ? dockStyles.dockDropHighlight : undefined}
        data-right-dock="true"
      />
    );
  }

  return (
    <div
      ref={dockPanelRef}
      className={[
        styles.workspace,
        dropActive ? dockStyles.dockDropHighlight : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={dockChromeStyle()}
      data-right-dock="true"
      data-right-layout={layout}
    >
      <div
        className={`${styles.grid} ${gridClass}`}
        style={
          layout === 'single'
            ? { gridTemplateRows: `repeat(${visibleIds.length}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {visibleIds.map((id) => (
          <WorkspaceCellObserved
            key={id}
            id={id}
            dragOverId={dragOverId}
            onDragOverId={setDragOverId}
          />
        ))}
      </div>
    </div>
  );
}

export const RightDockPanel = observer(RightDockPanelImpl);
export default RightDockPanel;
