import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useStores } from '../../../../stores/StoreContext';
import type { DockWindowId } from '../../../../stores/WindowDockStore';
import {
  getDockWindowConfig,
  rightDockConfig,
  type RightDockWindowConfig,
} from '../config/rightDock.config';
import DockWindowFrame from '../../shared/components/DockWindowFrame';
import PanelChrome from '../../shared/components/PanelChrome';
import ConfigIcon from '../../shared/components/ConfigIcon';
import MiniMap from './MiniMap';
import MiniVideo from './MiniVideo';
import overlays from '../../../styles/live-view/overlays.module.css';
import dockStyles from '../../../styles/shared/DockWindow.module.css';

function StatusDot({ live }: { live: boolean }) {
  return (
    <span
      className={live ? overlays.statusDotLive : overlays.statusDot}
      aria-hidden="true"
    />
  );
}

function VideoBody({
  cfg,
  onLiveChange,
}: {
  cfg: RightDockWindowConfig;
  onLiveChange: (live: boolean) => void;
}) {
  return (
    <Card variant="mediaFrame">
      <MiniVideo
        onStatusChange={(status, error) => onLiveChange(status === 'live' && !error)}
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
    </Card>
  );
}

function MinimapBody() {
  return (
    <Card variant="mediaFrame">
      <MiniMap />
    </Card>
  );
}

function DockedWindowCard({ id }: { id: DockWindowId }) {
  const { windowDockStore } = useStores();
  const cfg = getDockWindowConfig(id);
  const [videoLive, setVideoLive] = useState(false);

  if (!cfg?.enabled || !windowDockStore.isDocked(id)) return null;

  const win = windowDockStore.get(id);
  const { labels } = rightDockConfig;

  return (
    <DockWindowFrame
      title={cfg.title}
      expanded={win.expanded}
      onExpandedChange={(expanded) => windowDockStore.setExpanded(id, expanded)}
      onClose={() => windowDockStore.setOpen(id, false)}
      onUndock={
        cfg.canFloat
          ? () =>
              windowDockStore.undock(id, {
                width: rightDockConfig.floating.defaultWidth,
                height: rightDockConfig.floating.defaultHeight,
              })
          : undefined
      }
      undockLabel={labels.undock}
      closeLabel={labels.close}
      headerStartExtra={
        cfg.showLiveBadge ? <StatusDot live={videoLive} /> : undefined
      }
      headerEnd={
        cfg.showLiveBadge && videoLive ? (
          <Chip variant="live" label={labels.live} size="small" />
        ) : undefined
      }
    >
      {id === 'video' ? (
        <VideoBody cfg={cfg} onLiveChange={setVideoLive} />
      ) : (
        <MinimapBody />
      )}
    </DockWindowFrame>
  );
}

const DockedWindowCardObserved = observer(DockedWindowCard);

function DockToolbar() {
  const { windowDockStore } = useStores();
  const enabled = rightDockConfig.windows
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className={dockStyles.toolbar} role="toolbar" aria-label={rightDockConfig.toolbar.title}>
      {enabled.map((item) => {
        const active = windowDockStore.isOpen(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`${dockStyles.toolbarBtn} ${active ? dockStyles.toolbarBtnActive : ''}`}
            aria-pressed={active}
            onClick={() => {
              if (!active) {
                windowDockStore.dock(item.id);
                return;
              }
              // Open + floating → bring back to dock; open + docked → hide
              if (windowDockStore.isFloating(item.id)) {
                windowDockStore.dock(item.id);
              } else {
                windowDockStore.setOpen(item.id, false);
              }
            }}
          >
            <ConfigIcon iconPath={item.iconPath} tone={active ? 'active' : 'muted'} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

const DockToolbarObserved = observer(DockToolbar);

interface RightDockPanelProps {
  dropActive?: boolean;
  dockPanelRef?: React.Ref<HTMLDivElement>;
}

function RightDockPanelImpl({ dropActive = false, dockPanelRef }: RightDockPanelProps) {
  const { header } = rightDockConfig;
  const ordered = [...rightDockConfig.windows]
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      ref={dockPanelRef}
      className={dropActive ? dockStyles.dockDropHighlight : undefined}
      data-right-dock="true"
    >
      <PanelChrome title={header.title} subtitle={header.subtitle}>
        <DockToolbarObserved />
        <div className={dockStyles.stack}>
          {ordered.map((w) => (
            <DockedWindowCardObserved key={w.id} id={w.id} />
          ))}
        </div>
      </PanelChrome>
    </div>
  );
}

const RightDockPanel = observer(RightDockPanelImpl);
export default RightDockPanel;
