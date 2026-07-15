import { IconLayer, PathLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import droneIcon from '../../assets/drone.png';
import type { DroneTarget } from '../../stores/DroneStore';
import { mapVisualTokens } from '../styles/mapVisualTokens';
import { createSelectedGlassLampGlow } from './selectedGlassLampGlow';

const v = mapVisualTokens.drone;

/**
 * Drone map stack: trails → selected glass-lamp glow → heading-aligned icon.
 * Colors: `mapVisualTokens` (hub → designSystem.config.ts).
 */
export function createDroneLayers(
  targets: DroneTarget[],
  selectedId: string | null = null,
): Layer[] {
  const trails = targets.filter((t) => (t.trail?.length ?? 0) >= 2);
  const selected = selectedId
    ? targets.find((t) => t.id === selectedId) ?? null
    : null;
  const selectedTrails = selected && (selected.trail?.length ?? 0) >= 2 ? [selected] : [];

  return [
    new PathLayer<DroneTarget>({
      id: 'drone-trails',
      data: trails,
      getPath: (d) => d.trail,
      getColor: (d) => (selectedId === d.id ? v.trailSelected : v.trail),
      getWidth: (d) => (selectedId === d.id ? 4 : 2),
      widthUnits: 'pixels',
      widthMinPixels: 2,
      widthMaxPixels: 7,
      capRounded: true,
      jointRounded: true,
      updateTriggers: {
        getPath: trails.map((t) => t.trail.length + t.position[0] + t.position[1]),
        getColor: selectedId,
        getWidth: selectedId,
      },
    }),
    new PathLayer<DroneTarget>({
      id: 'drone-trails-core',
      data: selectedTrails,
      getPath: (d) => d.trail,
      getColor: v.trailCore,
      getWidth: 1.5,
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
    ...createSelectedGlassLampGlow('drone', selected, v.lamp),
    new IconLayer<DroneTarget>({
      id: 'drone-layer',
      data: targets,
      getPosition: (d) => d.position,
      getIcon: () => ({
        url: droneIcon,
        width: 64,
        height: 64,
        anchorX: 32,
        anchorY: 32,
      }),
      getSize: (d) => (selectedId === d.id ? 40 : 28),
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

export function createDroneLayer(
  targets: DroneTarget[],
  selectedId: string | null = null,
) {
  return createDroneLayers(targets, selectedId).at(-1)!;
}
