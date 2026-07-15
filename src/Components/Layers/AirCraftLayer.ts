import { IconLayer, PathLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import airCraftIcon from '../../assets/aircraft.png';
import type { AirCraftTarget } from '../../stores/AirCraftStore';
import { mapVisualTokens } from '../styles/mapVisualTokens';
import { createSelectedGlassLampGlow } from './selectedGlassLampGlow';

const v = mapVisualTokens.aircraft;

/**
 * Aircraft map stack: trails → selected glass-lamp glow → heading-aligned icon.
 * Asset nose points north; deck angle is CCW from east → use `-headingDeg`.
 * Colors: `mapVisualTokens` (hub → designSystem.config.ts).
 */
export function createAirCraftLayers(
  targets: AirCraftTarget[],
  selectedId: string | null = null,
): Layer[] {
  const trails = targets.filter((t) => (t.trail?.length ?? 0) >= 2);
  const selected = selectedId
    ? targets.find((t) => t.id === selectedId) ?? null
    : null;
  const selectedTrails = selected && (selected.trail?.length ?? 0) >= 2 ? [selected] : [];

  return [
    new PathLayer<AirCraftTarget>({
      id: 'aircraft-trails',
      data: trails,
      getPath: (d) => d.trail,
      getColor: (d) => (selectedId === d.id ? v.trailSelected : v.trail),
      getWidth: (d) => (selectedId === d.id ? 4.5 : 2.2),
      widthUnits: 'pixels',
      widthMinPixels: 2,
      widthMaxPixels: 8,
      capRounded: true,
      jointRounded: true,
      updateTriggers: {
        getPath: trails.map((t) => t.trail.length + t.position[0] + t.position[1]),
        getColor: selectedId,
        getWidth: selectedId,
      },
    }),
    new PathLayer<AirCraftTarget>({
      id: 'aircraft-trails-core',
      data: selectedTrails,
      getPath: (d) => d.trail,
      getColor: v.trailCore,
      getWidth: 1.6,
      widthUnits: 'pixels',
      widthMinPixels: 1,
      widthMaxPixels: 3,
      capRounded: true,
      jointRounded: true,
      updateTriggers: {
        getPath: selectedTrails.map(
          (t) => t.trail.length + t.position[0] + t.position[1],
        ),
      },
    }),
    ...createSelectedGlassLampGlow('aircraft', selected, v.lamp),
    new IconLayer<AirCraftTarget>({
      id: 'aircraft-layer',
      data: targets,
      getPosition: (d) => d.position,
      getIcon: () => ({
        url: airCraftIcon,
        width: 64,
        height: 64,
        anchorX: 32,
        anchorY: 32,
      }),
      getSize: (d) => (selectedId === d.id ? 44 : 32),
      sizeUnits: 'pixels',
      billboard: false,
      getAngle: (d) => -d.headingDeg,
      getColor: (d) => (selectedId === d.id ? v.iconSelected : v.icon),
      alphaCutoff: 0.05,
      updateTriggers: {
        getAngle: targets.map((t) => t.headingDeg),
        getPosition: targets.map((t) => t.position),
        getSize: selectedId,
        getColor: selectedId,
      },
    }),
  ];
}

export function createAirCraftLayer(
  targets: AirCraftTarget[],
  selectedId: string | null = null,
) {
  return createAirCraftLayers(targets, selectedId).at(-1)!;
}
