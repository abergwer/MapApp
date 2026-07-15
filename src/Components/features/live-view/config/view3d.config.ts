/**
 * External config for the Cesium flight simulator in the Workspace 3D card.
 * Live tracks use mode EXTERNAL — telemetry comes from TrackedTargetStore + stores.
 */
export const view3dConfig = {
  mode: 'EXTERNAL' as const,
  window: {
    /** Must be embedded so the widget fills the card (not 100vh fullscreen). */
    displayMode: 'embedded' as const,
    width: '100%' as const,
    height: '100%' as const,
    showViewModeToggle: false,
  },
  map: {
    mode: 'ONLINE_ESRI' as const,
  },
  terrain: {
    useCesiumWorldTerrain: false,
  },
  scene: {
    showSkyAtmosphere: true,
    showMoon: false,
    showSun: true,
    fogEnabled: false,
    depthTestAgainstTerrain: false,
  },
  start: {
    latitude: 32.0853,
    longitude: 34.7818,
    altitudeM: 1200,
    headingDeg: 25,
    speedMps: 145,
  },
  aircraft: {
    renderMode: 'GLTF' as const,
    modelUri: '/models/stealth_drone_perfect.glb',
    scale: 90,
    minimumPixelSize: 160,
    maximumScale: 2000,
    orientationMode: 'SWAP_PITCH_ROLL' as const,
  },
  camera: {
    enabled: true,
    mode: 'MANUAL_FORWARD_CHASE' as const,
    rangeBehindM: 500,
    heightAboveM: 140,
  },
  annotations: {
    hudTop: false,
    crosshair: false,
    attitudeIndicator: false,
    bottomTelemetry: true,
    trail: true,
    debugPanel: false,
    controlsHelp: false,
  },
} as const;
