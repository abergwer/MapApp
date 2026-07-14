import type { CSSProperties, ReactNode } from 'react';
import { appLayoutConfig } from '../../Components/features/app-shell';

interface MapOverlayProps {
  children: ReactNode;
  /** Corner placement on the map surface. */
  position?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
}

/**
 * Positions a child overlay on the map canvas using layout config tokens.
 */
export default function MapOverlay({
  children,
  position = 'bottomLeft',
}: MapOverlayProps) {
  const { mapOverlay, zIndex } = appLayoutConfig;
  const style: CSSProperties = {
    position: 'absolute',
    zIndex: zIndex.mapOverlay,
    pointerEvents: 'none',
  };

  if (position === 'bottomLeft') {
    (style as any).bottom = mapOverlay.coordinates.bottom;
    style.left = mapOverlay.coordinates.left;
  } else if (position === 'bottomRight') {
    (style as any).bottom = mapOverlay.coordinates.bottom;
    style.right = mapOverlay.coordinates.left;
  } else if (position === 'topLeft') {
    style.top = mapOverlay.coordinates.bottom;
    style.left = mapOverlay.coordinates.left;
  } else {
    style.top = mapOverlay.coordinates.bottom;
    style.right = mapOverlay.coordinates.left;
  }

  return <div style={style}>{children}</div>;
}
