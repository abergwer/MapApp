import { createPortal } from 'react-dom';
import { useMapContext } from '../../map/MapContext';
import './DrawingToolbar.css';

type Tool = {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
};

const tools: Tool[] = [
  { id: 'none',    label: 'Navigate',       icon: '✥', enabled: true },
  { id: 'polygon', label: 'Polygon',        icon: '▱', enabled: true },
  { id: 'circle',  label: 'Circle',         icon: '◯', enabled: true },
  { id: 'ellipse', label: 'Ellipse',        icon: '⬭', enabled: true },
  { id: 'p2p',     label: 'Point to Point', icon: '╱', enabled: true },
  { id: 'modify',  label: 'Edit',           icon: '✎', enabled: true },
];

export function DrawingToolbar({
  mode,
  setMode,
}: {
  mode: string;
  setMode: (mode: string) => void;
}) {
  // Render into the map canvas (alongside the deck.gl overlay canvas) so the
  // toolbar visually overlays the map while staying grouped with LayerManager
  // in the React tree. Gating on `engine` guarantees the container ref is
  // populated before we try to portal into it.
  const { engine, containerRef } = useMapContext();
  const container = engine ? containerRef.current : null;

  const toolbar = (
    <div
      className="drawing-toolbar map-toolbar-overlay"
      role="toolbar"
      aria-label="Drawing tools"
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={`drawing-toolbar__btn${mode === tool.id ? ' is-active' : ''}`}
          aria-pressed={mode === tool.id}
          aria-label={tool.label}
          title={tool.label}
          disabled={!tool.enabled}
          onClick={() => setMode(tool.id)}
        >
          <span className="drawing-toolbar__icon" aria-hidden="true">
            {tool.icon}
          </span>
        </button>
      ))}
    </div>
  );

  return container ? createPortal(toolbar, container) : null;
}
