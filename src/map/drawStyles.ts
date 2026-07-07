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

  // Midpoint handles — click one to insert a new vertex between existing
  // nodes. Smaller + hollow-looking so they're visually distinct from real
  // vertices below.
  {
    id: 'gl-draw-line-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#0000ff',
      'circle-stroke-width': 2
    }
  },

  // Vertex (the draggable node dot) — matches the original point style
  {
    id: 'gl-draw-vertex',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#0000ff'
    }
  },

  // Points (only standalone user-drawn points, not vertex/midpoint handles)
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#0000ff'
    }
  }
];
