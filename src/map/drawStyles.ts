export const drawStyles = [
  // Polygon fill
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#ff0000',
      'fill-opacity': 0.3
    }
  },

  // Polygon outline
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'line-color': '#ff0000',
      'line-width': 2
    }
  },

  // Line drawing
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString']],
    paint: {
      'line-color': '#00ff00',
      'line-width': 3
    }
  },

  // Points
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#0000ff'
    }
  }
];
