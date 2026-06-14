import { useCallback, useRef, useState } from 'react';
import { createDrawingLayer } from '../Components/Layers/DrawingLayer';

const EMPTY_FC = { type: 'FeatureCollection', features: [] as unknown[] };

export function useDrawingController(mode: string) {
  const [features, setFeatures] = useState<typeof EMPTY_FC>(EMPTY_FC);

  // Keep the latest features in a ref so the onEdit callback can stay stable
  // (its identity must not change between renders or editable-layers will
  // reset the tentative drawing on every commit).
  const featuresRef = useRef(features);
  featuresRef.current = features;

  const onEdit = useCallback(({ updatedData }: any) => {
    setFeatures(updatedData);
  }, []);

  // Build a fresh layer descriptor on every render. Deck.gl diffs by `id`
  // and preserves the underlying layer state (including the tentative
  // polygon vertices being drawn), so this is cheap and correct. Memoizing
  // on `features` was the bug: it caused a brand-new layer instance, which
  // — combined with a fresh `selectedFeatureIndexes` — wiped the in-progress
  // drawing on every click.
  const drawingLayer = createDrawingLayer({
    mode,
    data: features,
    onEdit,
  });

  return drawingLayer;
}
