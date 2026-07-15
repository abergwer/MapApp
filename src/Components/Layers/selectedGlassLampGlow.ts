import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';

type Rgba = [number, number, number, number];
type LngLatTarget = { id: string; position: [number, number] };

export interface GlassLampPalette {
  /** Soft wide bloom */
  bloom: Rgba;
  /** Glass mid ring */
  glass: Rgba;
  /** Bright lamp body */
  lamp: Rgba;
  /** Hot white spark at center */
  spark: Rgba;
}

/**
 * Concentric soft discs — only for the selected target.
 * Reads like a glass lamp / neon bulb behind the icon.
 */
export function createSelectedGlassLampGlow(
  layerIdPrefix: string,
  selected: LngLatTarget | null | undefined,
  palette: GlassLampPalette,
): Layer[] {
  const data = selected ? [selected] : [];
  const t = performance.now() / 1000;
  // Gentle breathe — glass lamp, not a harsh blink.
  const breathe = 0.88 + 0.12 * Math.sin(t * 2.2);
  const shimmer = 0.92 + 0.08 * Math.sin(t * 5.5);

  const mk = (
    suffix: string,
    radiusPx: number,
    color: Rgba,
    radiusScale: number,
  ) =>
    new ScatterplotLayer<LngLatTarget>({
      id: `${layerIdPrefix}-${suffix}`,
      data,
      getPosition: (d) => d.position,
      getRadius: radiusPx * radiusScale,
      radiusUnits: 'pixels',
      getFillColor: color,
      stroked: false,
      filled: true,
      pickable: false,
      parameters: {
        // Additive-ish soft blend so rings stack like glass light.
        depthTest: false,
      },
      updateTriggers: {
        getPosition: data.map((d) => d.position),
        getRadius: [breathe, shimmer, radiusPx],
        getFillColor: color,
      },
    });

  return [
    mk('glow-bloom', 52, palette.bloom, breathe),
    mk('glow-glass', 34, palette.glass, breathe),
    mk('glow-lamp', 18, palette.lamp, shimmer),
    mk('glow-spark', 7, palette.spark, shimmer),
  ];
}
