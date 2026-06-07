import { IconLayer } from '@deck.gl/layers';
import droneIcon from '../../assets/drone.png';


export const targets = [
  {
    id: 't1',
    position: [34.7818, 32.0853], // Tel Aviv
    icon: droneIcon,
  },
  {
    id: 't2',
    position: [34.9885, 32.7940], // Haifa
    icon: droneIcon,
  },
  {
    id: 't3',
    position: [34.8555, 32.1093], // Herzliya
    icon: droneIcon,
  },
  {
    id: 't4',
    position: [35.2137, 31.7683], // Jerusalem
    icon: droneIcon,
  },
  {
    id: 't5',
    position: [34.9519, 29.5577], // Eilat
    icon: droneIcon,
  },
  {
    id: 't6',
    position: [35.3027, 32.9216], // Nazareth
    icon: droneIcon,
  },
  {
    id: 't7',
    position: [34.5742, 31.6693], // Ashdod
    icon: droneIcon,
  },
  {
    id: 't8',
    position: [34.7930, 31.2518], // Be’er Sheva
    icon: droneIcon,
  },
];

export const DroneLayer = new IconLayer({
    id: 'drone-layer',
    data: targets,
    getIcon: () => ({
        url: droneIcon,
        width: 24,
        height: 24,
        // bottom vertically
    }),
    getSize: 24,
    widthMinPixels: 4,
    widthMaxPixels: 14,
    getColor: [255, 0, 0],
});