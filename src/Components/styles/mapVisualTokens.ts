/**
 * Map / Deck.gl visual tokens (RGBA tuples).
 * Deck cannot consume CSS variables — keep values aligned with tokens.css
 * accents (primary / entity-glow / danger-ish reds for aircraft).
 *
 * Hub: `src/config/designSystem.config.ts`
 */

export type Rgba = [number, number, number, number];

export const mapVisualTokens = {
  aircraft: {
    trail: [255, 90, 90, 110] as Rgba,
    trailSelected: [255, 220, 120, 200] as Rgba,
    trailCore: [255, 245, 200, 240] as Rgba,
    icon: [255, 120, 120, 255] as Rgba,
    iconSelected: [255, 248, 210, 255] as Rgba,
    lamp: {
      bloom: [255, 160, 60, 55] as Rgba,
      glass: [255, 200, 90, 90] as Rgba,
      lamp: [255, 235, 150, 150] as Rgba,
      spark: [255, 255, 245, 230] as Rgba,
    },
  },
  drone: {
    trail: [80, 210, 255, 100] as Rgba,
    trailSelected: [160, 240, 255, 200] as Rgba,
    trailCore: [230, 255, 255, 240] as Rgba,
    icon: [140, 230, 255, 255] as Rgba,
    iconSelected: [235, 255, 255, 255] as Rgba,
    lamp: {
      bloom: [40, 180, 255, 55] as Rgba,
      glass: [90, 220, 255, 95] as Rgba,
      lamp: [170, 245, 255, 155] as Rgba,
      spark: [245, 255, 255, 235] as Rgba,
    },
  },
} as const;

export type MapVisualTokens = typeof mapVisualTokens;
