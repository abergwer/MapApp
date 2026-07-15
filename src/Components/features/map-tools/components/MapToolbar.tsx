import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Tooltip from '@mui/material/Tooltip';
import Slider from '@mui/material/Slider';
import { mapToolbarConfig, type MapToolbarToolId } from '../config/mapToolbar.config';
import { useMapContext } from '../../../../map/MapContext';
import { useStores } from '../../../../stores/StoreContext';
import type { DockWindowId } from '../../../../stores/WindowDockStore';
import type { BaseMap } from '../../../../stores/MapStyleStore';
import ConfigIcon from '../../shared/components/ConfigIcon';
import { setBaseMapStyle, supportsBaseMapSwitch } from '../actions/mapStyleActions';
import {
  clearMeasurements,
  isMeasureSupported,
  selectMeasureTool,
} from '../actions/measureToolActions';
import {
  cancelDrawSession,
  isDrawToolSupported,
  selectDrawTool,
} from '../../entities/actions/drawToolActions';
import { useBasemapBrightness } from '../hooks/useBasemapBrightness';
import styles from '../../../styles/map-tools/MapToolbar.module.css';

function stopMapEvent(e: React.SyntheticEvent | Event) {
  e.stopPropagation();
  if ('preventDefault' in e) e.preventDefault();
}

function MapToolbarImpl() {
  const { containerRef } = useMapContext();
  const {
    mapEngineStore,
    drawingToolStore,
    mapStyleStore,
    windowDockStore,
    entityService,
  } = useStores();
  const engine = mapEngineStore.engine;
  const [brightnessOpen, setBrightnessOpen] = useState(false);
  const mapDragLockedRef = useRef(false);
  const { layout, brightness, tooltipPlacement, groupOrder } = mapToolbarConfig;

  const chromeStyle = {
    '--map-toolbar-btn': `${layout.buttonSize}px`,
    '--map-toolbar-icon': `${layout.iconSize}px`,
    '--map-toolbar-gap': `${layout.gap}px`,
    '--map-toolbar-padding': `${layout.padding}px`,
    '--map-toolbar-sep-h': `${layout.separatorHeight}px`,
    '--map-toolbar-sep-m': `${layout.separatorMargin}px`,
    '--map-toolbar-popover-w': `${brightness.popoverWidth}px`,
    '--map-toolbar-popover-oy': `${brightness.popoverOffsetY}px`,
  } as React.CSSProperties;

  useBasemapBrightness(containerRef, mapStyleStore.brightness, mapStyleStore.baseMap);

  const setMapDragEnabled = (enabled: boolean) => {
    mapDragLockedRef.current = !enabled;
    mapEngineStore.engine?.setMapInteractionEnabled?.(enabled);
  };

  useEffect(() => {
    return () => {
      mapEngineStore.engine?.setMapInteractionEnabled?.(true);
      mapDragLockedRef.current = false;
    };
  }, [mapEngineStore]);

  const beginBrightnessDrag = (
    e: React.PointerEvent | React.MouseEvent | React.TouchEvent,
  ) => {
    stopMapEvent(e);
    setMapDragEnabled(false);

    const release = () => {
      setMapDragEnabled(true);
      window.removeEventListener('pointerup', release, true);
      window.removeEventListener('pointercancel', release, true);
      window.removeEventListener('mouseup', release, true);
      window.removeEventListener('touchend', release, true);
    };

    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', release, true);
    window.addEventListener('mouseup', release, true);
    window.addEventListener('touchend', release, true);
  };

  const grouped = useMemo(() => {
    return groupOrder.map((group) => ({
      group,
      items: mapToolbarConfig.items.filter((item) => item.group === group),
    })).filter((g) => g.items.length > 0);
  }, [groupOrder]);

  const isActive = (id: MapToolbarToolId): boolean => {
    switch (id) {
      case 'select':
        return (
          drawingToolStore.activeDrawTool == null &&
          drawingToolStore.activeMeasureTool == null
        );
      case 'distance':
      case 'area':
        return drawingToolStore.activeMeasureTool === id;
      case 'polygon':
        return drawingToolStore.activeDrawTool === 'polygon';
      case 'line':
        return drawingToolStore.activeDrawTool === 'line';
      case 'marker':
        return drawingToolStore.activeDrawTool === 'point';
      case 'mapStyle':
        return mapStyleStore.baseMap === 'satellite';
      case 'brightness':
        return brightnessOpen;
      case 'minimap':
      case 'video':
      case 'view3d':
      case 'intel':
        return windowDockStore.isOpen(id);
      default:
        return false;
    }
  };

  const toggleWindow = (id: DockWindowId) => {
    if (windowDockStore.isOpen(id)) {
      if (windowDockStore.isFloating(id)) {
        windowDockStore.dock(id);
      } else {
        windowDockStore.setOpen(id, false);
      }
    } else {
      windowDockStore.dock(id);
    }
  };

  const handleClick = (id: MapToolbarToolId) => {
    switch (id) {
      case 'select':
        cancelDrawSession(engine, drawingToolStore);
        break;
      case 'distance':
      case 'area':
        selectMeasureTool(engine, drawingToolStore, id);
        break;
      case 'clear':
        clearMeasurements(engine, drawingToolStore);
        break;
      case 'polygon':
        selectDrawTool(engine, drawingToolStore, entityService, 'polygon');
        break;
      case 'line':
        selectDrawTool(engine, drawingToolStore, entityService, 'line');
        break;
      case 'marker':
        selectDrawTool(engine, drawingToolStore, entityService, 'point');
        break;
      case 'mapStyle': {
        if (!supportsBaseMapSwitch(engine)) return;
        const next: BaseMap = mapStyleStore.baseMap === 'satellite' ? 'light' : 'satellite';
        setBaseMapStyle(engine, mapStyleStore, next);
        break;
      }
      case 'brightness':
        setBrightnessOpen((v) => !v);
        break;
      case 'minimap':
      case 'video':
      case 'view3d':
      case 'intel':
        toggleWindow(id);
        break;
      default:
        break;
    }
  };

  const isDisabled = (id: MapToolbarToolId): boolean => {
    switch (id) {
      case 'distance':
      case 'area':
      case 'clear':
        return !isMeasureSupported(engine);
      case 'polygon':
        return !isDrawToolSupported(engine, 'polygon');
      case 'line':
        return !isDrawToolSupported(engine, 'line');
      case 'marker':
        return !isDrawToolSupported(engine, 'point');
      case 'mapStyle':
        return !supportsBaseMapSwitch(engine);
      default:
        return false;
    }
  };

  return (
    <div
      className={styles.toolbarWrap}
      style={chromeStyle}
      onPointerDown={stopMapEvent}
      onMouseDown={stopMapEvent}
      onTouchStart={stopMapEvent}
      onWheel={stopMapEvent}
    >
      <div className={styles.toolbar} role="toolbar" aria-label="Map tools">
        {grouped.map((g, index) => (
          <div key={g.group} className={styles.group}>
            {index > 0 && <div className={styles.separator} aria-hidden="true" />}
            {g.items.map((item) => (
              <Tooltip key={item.id} title={item.label} placement={tooltipPlacement}>
                <span>
                  <button
                    type="button"
                    className={[
                      styles.btn,
                      isActive(item.id) ? styles.btnActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={item.label}
                    aria-pressed={isActive(item.id)}
                    disabled={isDisabled(item.id)}
                    onClick={() => handleClick(item.id)}
                  >
                    <ConfigIcon
                      iconPath={item.iconPath}
                      className={styles.icon}
                      tone={isActive(item.id) ? 'active' : 'muted'}
                    />
                  </button>
                </span>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      {brightnessOpen && (
        <div
          className={styles.brightnessPopover}
          onPointerDown={beginBrightnessDrag}
          onMouseDown={beginBrightnessDrag}
          onTouchStart={beginBrightnessDrag}
          onWheel={stopMapEvent}
        >
          <div className={styles.brightnessLabel}>
            <span>{brightness.label}</span>
            <span>{mapStyleStore.brightness}%</span>
          </div>
          <Slider
            size="small"
            min={brightness.min}
            max={brightness.max}
            step={brightness.step}
            value={mapStyleStore.brightness}
            onChange={(_, value) => mapStyleStore.setBrightness(value as number)}
            onChangeCommitted={() => setMapDragEnabled(true)}
            aria-label={brightness.label}
          />
        </div>
      )}
    </div>
  );
}

const MapToolbar = observer(MapToolbarImpl);
export default MapToolbar;
