import { IconLayer } from "@deck.gl/layers";
import airCraftLayer from '../../assets/aircraft.png';

export const targets = [
 {
    id: 't1',
    position: [34.4206, 31.8167], // Ashkelon coast
    icon: airCraftLayer,
  },
  {
    id: 't2',
    position: [35.0100, 32.7500], // Carmel mountain range
    icon: airCraftLayer,
  },
  {
    id: 't3',
    position: [34.9000, 31.2500], // Negev north desert
    icon: airCraftLayer,
  },
  {
    id: 't4',
    position: [35.5800, 33.0500], // Upper Galilee (east)
    icon: airCraftLayer,
  },
  {
    id: 't5',
    position: [34.3000, 31.5000], // Gaza border area (west Negev)
    icon: airCraftLayer,
  },
  {
    id: 't6',
    position: [35.4700, 32.9000], // Sea of Galilee west side
    icon: airCraftLayer,
  },
  {
    id: 't7',
    position: [34.9700, 29.5600], // Eilat mountains (Timna area)
    icon: airCraftLayer,
  },
  {
    id: 't8',
    position: [35.3000, 32.5000], // West Bank hills (central highlands)
    icon: airCraftLayer,
  },
  {
    id: 't9',
    position: [34.6000, 32.0500], // Central coastal plain (south of TLV)
    icon: airCraftLayer,
  },
  {
    id: 't10',
    position: [35.1500, 31.9000], // Jerusalem outskirts / Judean hills
    icon: airCraftLayer,
  },
];

export const AirCraftLayer = new IconLayer({
    id: 'aircraft-layer',
    data: targets,
    getIcon: () => ({
        url: airCraftLayer,
        width: 30,
        height: 30,
        // bottom vertically
    }),
    getSize: 30,
    widthMinPixels: 4,
    widthMaxPixels: 14,
    getColor: [255, 0, 0],
});