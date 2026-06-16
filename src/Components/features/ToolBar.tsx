import { useEffect, useRef, useState } from 'react';
import { useMapContext } from '../../map/MapContext';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import './ToolBar.css';

type DrawTool =
  | 'point'
  | 'line'
  | 'polygon'
  | 'circle'
  | 'ellipse'
  | 'sector'
  | 'measure-distance'
  | 'measure-area'
  | 'remove-measurements'
  ;

const DRAW_TOOLS: { id: DrawTool; label: string; icon: string; enabled: boolean }[] = [
  { id: 'point', label: 'Point', icon: '•', enabled: true },
  { id: 'line', label: 'Line', icon: '╱', enabled: true },
  { id: 'polygon', label: 'Polygon', icon: '▱', enabled: true },
  { id: 'circle', label: 'Circle', icon: '◯', enabled: true },
  { id: 'ellipse', label: 'Ellipse', icon: '⬭', enabled: true },
  { id: 'sector', label: 'Sector', icon: '◔', enabled: true },
];

const MEASURE_TOOLS: { id: DrawTool; label: string; icon: string }[] = [
  { id: 'measure-distance', label: 'Measure Distance', icon: '↳' },
  { id: 'measure-area', label: 'Measure Area', icon: '▢' },
  { id: 'remove-measurements', label: 'Remove Measurements', icon: '✖' },
];

interface ToolBarProps {
  /** Show the measure-distance / measure-area / clear group. Default: true. */
  showMeasureTools?: boolean;
}

function startDraw(engine: MapEngine, tool: DrawTool) {
  switch (tool) {
    case 'point':
      return engine.startDrawPoint((pos) => console.log('point', pos));
    case 'line':
      return engine.startDrawLine((pts) => console.log('line', pts));
    case 'polygon':
      return engine.startDrawPolygon((pts) => console.log('polygon', pts));
    case 'circle':
      return engine.startDrawCircle((center, radius) =>
        console.log('circle', center, radius)
      );
    case 'ellipse':
      return engine.startDrawEllipse?.((center, radiusX, radiusY) =>
        console.log('ellipse', center, radiusX, radiusY)
      );
    case 'sector':
      return engine.startDrawSector?.((center, radius, startBearing, endBearing) =>
        console.log('sector', center, radius, startBearing, endBearing)
      );
    case 'measure-distance':
      return engine.startMeasureDistance?.((km) => console.log('distance (km)', km));
    case 'measure-area':
      return engine.startMeasureArea?.((km2) => console.log('area (km²)', km2));
    case 'remove-measurements':
      return engine.removeMeasurements?.();
  }
}

export default function ToolBar({ showMeasureTools = true }: ToolBarProps = {}) {
  const { engine } = useMapContext();
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null);
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(true);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // Make sure edit mode is dropped if the engine swaps out from under us.
  useEffect(() => {
    return () => {
      engine?.setEditMode?.(false);
    };
  }, [engine]);

  const handleSelect = (tool: DrawTool) => {
    if (!engine) return;
    if (editing) {
      engine.setEditMode?.(false);
      setEditing(false);
    }
    setActiveTool(tool);
    startDraw(engine, tool);
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    engine?.setEditMode?.(false);
    setActiveTool(null);
    setEditing(false);
    setOpen(false);
  };

  const handleToggleEdit = () => {
    if (!engine?.setEditMode) return;
    const next = !editing;
    // Drop any in-progress draw before switching modes.
    if (next) {
      engine.cancelDrawing();
      setActiveTool(null);
    }
    engine.setEditMode(next);
    setEditing(next);
  };

  const supportsEdit = Boolean(engine?.setEditMode);
  const supportsMeasure =
    showMeasureTools &&
    Boolean(
      engine?.startMeasureDistance &&
        engine?.startMeasureArea &&
        engine?.removeMeasurements
    );
  const activeLabel =
    DRAW_TOOLS.find((t) => t.id === activeTool)?.label ??
    MEASURE_TOOLS.find((t) => t.id === activeTool)?.label;
  const triggerLabel = editing
    ? 'Edit mode'
    : activeLabel
    ? `Draw: ${activeLabel}`
    : 'Draw';

  return (
    <div className="toolbar" ref={rootRef}>
      <button
        type="button"
        className={`toolbar-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        disabled={!engine}
      >
        <span className="toolbar-trigger-label">{triggerLabel}</span>
        <span className="toolbar-trigger-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="toolbar-menu" role="menu">
          {DRAW_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="menuitem"
              className={`toolbar-menu-item ${activeTool === tool.id && !editing ? 'is-active' : ''}`}
              onClick={() => handleSelect(tool.id)}
              disabled={!tool.enabled}
              title={tool.enabled ? undefined : 'Not implemented yet'}
            >
              <span className="toolbar-menu-icon" aria-hidden>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}

          {supportsMeasure && (
            <>
              <div className="toolbar-menu-divider" />
              {MEASURE_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  role="menuitem"
                  className={`toolbar-menu-item ${activeTool === tool.id && !editing ? 'is-active' : ''}`}
                  onClick={() => handleSelect(tool.id)}
                >
                  <span className="toolbar-menu-icon" aria-hidden>{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              ))}
            </>
          )}

          {supportsEdit && (
            <>
              <div className="toolbar-menu-divider" />
              <button
                type="button"
                role="menuitem"
                className={`toolbar-menu-item ${editing ? 'is-active' : ''}`}
                onClick={handleToggleEdit}
              >
                <span className="toolbar-menu-icon" aria-hidden>✎</span>
                <span>{editing ? 'Stop editing' : 'Edit shapes'}</span>
              </button>
            </>
          )}

          <div className="toolbar-menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="toolbar-menu-item is-cancel"
            onClick={handleCancel}
            disabled={!activeTool && !editing}
          >
            <span className="toolbar-menu-icon" aria-hidden>✕</span>
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
}