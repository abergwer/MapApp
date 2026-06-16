import { useEffect, useRef, useState } from 'react';
import { useMapContext } from '../../map/MapContext';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import './ToolBar.css';

type MeasureTool = 'distance' | 'area';

const MEASURE_TOOLS: { id: MeasureTool; label: string; icon: string }[] = [
  { id: 'distance', label: 'Measure Distance', icon: '↳' },
  { id: 'area', label: 'Measure Area', icon: '▢' },
];

function startMeasure(engine: MapEngine, tool: MeasureTool) {
  switch (tool) {
    case 'distance':
      return engine.startMeasureDistance?.((km) => console.log('distance (km)', km));
    case 'area':
      return engine.startMeasureArea?.((km2) => console.log('area (km²)', km2));
  }
}

/**
 * Self-contained dropdown for the measurement tools. Only renders when the
 * active map engine implements the full measurement API on `MapEngine`.
 */
export default function MeasuringTools() {
  const { engine } = useMapContext();
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<MeasureTool | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const supported = Boolean(
    engine?.startMeasureDistance &&
      engine?.startMeasureArea &&
      engine?.removeMeasurements,
  );
  if (!supported) return null;

  const handleSelect = (tool: MeasureTool) => {
    if (!engine) return;
    setActiveTool(tool);
    startMeasure(engine, tool);
  };

  const handleClear = () => {
    engine?.removeMeasurements?.();
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    setActiveTool(null);
    setOpen(false);
  };

  const activeLabel = MEASURE_TOOLS.find((t) => t.id === activeTool)?.label;
  const triggerLabel = activeLabel ? `Measure: ${activeLabel}` : 'Measure';

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
          {MEASURE_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="menuitem"
              className={`toolbar-menu-item ${activeTool === tool.id ? 'is-active' : ''}`}
              onClick={() => handleSelect(tool.id)}
            >
              <span className="toolbar-menu-icon" aria-hidden>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}

          <div className="toolbar-menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="toolbar-menu-item"
            onClick={handleClear}
          >
            <span className="toolbar-menu-icon" aria-hidden>✖</span>
            <span>Remove Measurements</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="toolbar-menu-item is-cancel"
            onClick={handleCancel}
            disabled={!activeTool}
          >
            <span className="toolbar-menu-icon" aria-hidden>✕</span>
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
}
