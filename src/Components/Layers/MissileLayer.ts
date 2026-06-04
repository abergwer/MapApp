import { PathLayer } from '@deck.gl/layers';

export const missiles: any = [
  {
    id: "m1",
    path: [
      [34.95, 32.80], // near Haifa offshore
      [34.96, 32.78],
      [34.97, 32.76],
      [34.98, 32.74],
      [34.99, 32.72],
      [35.00, 32.70]
    ]
  },
  {
    id: "m2",
    path: [
      [35.10, 32.10], // inland north
      [35.12, 32.08],
      [35.14, 32.06],
      [35.16, 32.04],
      [35.18, 32.02],
      [35.20, 32.00]
    ]
  },
  {
    id: "m3",
    path: [
      [34.80, 31.50], // central → south direction
      [34.82, 31.48],
      [34.85, 31.45],
      [34.88, 31.42],
      [34.92, 31.38],
      [34.96, 31.34]
    ]
  },
  {
    id: "m4",
    path: [
      [34.60, 32.40], // west to east arc
      [34.65, 32.42],
      [34.70, 32.44],
      [34.75, 32.46],
      [34.80, 32.48],
      [34.85, 32.50]
    ]
  },
  {
    id: "m5",
    path: [
      [34.90, 29.50], // Eilat region upward trajectory
      [34.92, 29.70],
      [34.94, 29.90],
      [34.96, 30.10],
      [34.98, 30.30],
      [35.00, 30.50]
    ]
  }
];

export const  createMissilesLayer = new PathLayer({
    id: 'missiles-layer',

    data: missiles,

    getPath: (d: typeof missiles[number]) => d.path,

    getColor: [255, 80, 0],

    widthMinPixels: 2,
    widthMaxPixels: 4,

    rounded: true,
  });

