declare module 'maplibre-gl-draw-circle' {
  // The package re-exports MapboxDraw's mode objects with circle additions.
  // We type them as opaque objects since they're only passed to MapboxDraw via `modes`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DrawMode = any;
  export const CircleMode: DrawMode;
  export const DragCircleMode: DrawMode;
  export const DirectMode: DrawMode;
  export const SimpleSelectMode: DrawMode;
}
