import { EditableGeoJsonLayer } from '@deck.gl-community/editable-layers';
import {
  DrawPolygonMode,
  DrawCircleFromCenterMode,
  DrawEllipseByBoundingBoxMode,
  DrawLineStringMode,
  ModifyMode
} from '@deck.gl-community/editable-layers';

// Stable empty selection. editable-layers warns that passing a NEW array on
// each render will clear the in-progress drawing (tentative polygon vertices,
// etc.). Sharing one reference avoids that.
const EMPTY_SELECTION: number[] = [];

export const createDrawingLayer = ({ mode, data, onEdit }: any) => {
  const selectedMode =
    mode === 'polygon'
      ? DrawPolygonMode
      : mode === 'circle'
      ? DrawCircleFromCenterMode
      : mode === 'ellipse'
      ? DrawEllipseByBoundingBoxMode
      : mode === 'p2p'
      ? DrawLineStringMode
      : ModifyMode;

  return new EditableGeoJsonLayer({
    id: 'drawing-layer',
    data,
    mode: selectedMode,
    // Required for DrawPolygonMode / DrawLineStringMode. Pass the same array
    // reference each render so nebula.gl does not clear the tentative draw.
    selectedFeatureIndexes: EMPTY_SELECTION,
    onEdit,
    getFillColor: [0, 0, 255, 80],
    getLineColor: [0, 0, 255, 255],
    getLineWidth: 2
  });
};
