import { IconLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import airCraftIcon from '../../assets/aircraft.png';
import type { AirCraftTarget } from '../../stores/AirCraftStore';
import { layerColors } from '../../styles/features/layers.styles';

export function createAirCraftLayer(targets: AirCraftTarget[]): Layer[] {
  return [
    new IconLayer<AirCraftTarget>({
      id: 'aircraft-layer',
      data: targets,
      getPosition: (d) => d.position,
      // `mask: true` lets deck.gl tint the silhouette with our token color
      // so it stays visible on the dark basemap.
      getIcon: () => ({ url: airCraftIcon, width: 30, height: 30, mask: true }),
      getSize: 30,
      getColor: layerColors.aircraft,
      getAngle: (d) => -d.heading,
    }),
    // new TextLayer<AirCraftTarget>({
    //   id: 'aircraft-labels',
    //   data: targets,
    //   getPosition: (d) => d.position,
    //   getText: label,
    //   ...targetLabelProps,
    // }),
  ];
}
