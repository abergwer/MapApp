import { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import Stack from '@mui/material/Stack';
import { useStores } from '../../../../stores/StoreContext';
import type { DockWindowId, FloatRect } from '../../../../stores/WindowDockStore';
import {
  getDockWindowConfig,
  rightDockConfig,
} from '../config/rightDock.config';
import FloatingWindow from '../../shared/components/FloatingWindow';
import MiniMap from './MiniMap';
import MiniVideo from './MiniVideo';
import overlays from '../../../styles/live-view/overlays.module.css';
import dockStyles from '../../../styles/shared/DockWindow.module.css';
import { appLayoutConfig } from '../../app-shell/config/appLayout.config';

interface FloatingWindowsHostProps {
  dockDropRef: React.RefObject<HTMLElement | null>;
  onDropActiveChange?: (active: boolean) => void;
}

function FloatingWindowContent({ id }: { id: DockWindowId }) {
  const cfg = getDockWindowConfig(id);
  if (!cfg) return null;

  return (
    <div className={dockStyles.mediaFill}>
      <div className={dockStyles.mediaFillFrame}>
        {id === 'video' ? <MiniVideo /> : <MiniMap />}
        {id === 'video' && (
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
        )}
      </div>
    </div>
  );
}

function FloatingWindowsHostImpl({
  dockDropRef,
  onDropActiveChange,
}: FloatingWindowsHostProps) {
  const { windowDockStore } = useStores();
  const { floating, labels } = rightDockConfig;

  const hitDock = useCallback(
    (clientX: number, clientY: number) => {
      const el = dockDropRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      );
    },
    [dockDropRef],
  );

  const floatingIds = (Object.keys(windowDockStore.windows) as DockWindowId[]).filter(
    (id) => windowDockStore.isFloating(id),
  );

  if (floatingIds.length === 0) return null;

  return (
    <>
      {floatingIds.map((id) => {
        const win = windowDockStore.get(id);
        const cfg = getDockWindowConfig(id);
        const rect = win.floatRect;
        if (!cfg || !rect) return null;

        return (
          <FloatingWindow
            key={id}
            title={cfg.title}
            rect={rect}
            zIndex={windowDockStore.floatZIndex(id, appLayoutConfig.zIndex.floatingWindow)}
            expanded={win.expanded}
            minWidth={floating.minWidth}
            minHeight={floating.minHeight}
            dockLabel={labels.dock}
            closeLabel={labels.close}
            onFocus={() => windowDockStore.bringToFront(id)}
            onRectChange={(next: FloatRect) => windowDockStore.setFloatRect(id, next)}
            onExpandedChange={(expanded) => windowDockStore.setExpanded(id, expanded)}
            onDock={() => {
              onDropActiveChange?.(false);
              windowDockStore.dock(id);
            }}
            onClose={() => windowDockStore.setOpen(id, false)}
            onDragMove={(x, y) => onDropActiveChange?.(hitDock(x, y))}
            onDragEnd={(x, y) => {
              if (hitDock(x, y)) windowDockStore.dock(id);
              onDropActiveChange?.(false);
            }}
          >
            <FloatingWindowContent id={id} />
          </FloatingWindow>
        );
      })}
    </>
  );
}

const FloatingWindowsHost = observer(FloatingWindowsHostImpl);
export default FloatingWindowsHost;
