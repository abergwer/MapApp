import { useEffect, useRef, useState } from 'react';
import { useMapContext } from '../../map/MapContext';
import type { MapEngine } from '../../map/MapEngine';
import './ToolBar.css';

type DrawTool = 'point' | 'line' | 'polygon' | 'circle';

const DRAW_TOOLS: { id: DrawTool; label: string; icon: string; enabled: boolean }[] = [
  { id: 'point', label: 'Point', icon: '•', enabled: false },
  { id: 'line', label: 'Line', icon: '╱', enabled: true },
  { id: 'polygon', label: 'Polygon', icon: '▱', enabled: true },
  { id: 'circle', label: 'Circle', icon: '◯', enabled: true },
];

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
  }
}

export default function ToolBar() {
  const { engine } = useMapContext();
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleSelect = (tool: DrawTool) => {
    if (!engine) return;
    setActiveTool(tool);
    setOpen(false);
    startDraw(engine, tool);
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    setActiveTool(null);
    setOpen(false);
  };

  const activeLabel = DRAW_TOOLS.find((t) => t.id === activeTool)?.label;

  return (
    <div className="toolbar" ref={rootRef}>
      <button
        type="button"
        className={`toolbar-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        disabled={!engine}
      >
        <span className="toolbar-trigger-label">
          {activeLabel ? `Draw: ${activeLabel}` : 'Draw'}
        </span>
        <span className="toolbar-trigger-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="toolbar-menu" role="menu">
          {DRAW_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="menuitem"
              className={`toolbar-menu-item ${activeTool === tool.id ? 'is-active' : ''}`}
              onClick={() => handleSelect(tool.id)}
              disabled={!tool.enabled}
              title={tool.enabled ? undefined : 'Not implemented yet'}
            >
              <span className="toolbar-menu-icon" aria-hidden>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}

          <div className="toolbar-menu-divider" />

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