# Map Architecture

## Goal

The application supports multiple map engines while exposing a single, engine-agnostic API to the rest of the application.

Current supported engines:

- MapLibre (mapbox-gl-draw)
- Leaflet (Geoman)

Business logic must never depend on a specific map implementation.

---

## Core Principle

All map operations go through `IMapEngine`.

Only engine implementations may import or use:

- maplibre-gl
- @mapbox/mapbox-gl-draw
- leaflet
- @geoman-io/leaflet-geoman

Every other part of the application must communicate only with `IMapEngine`.

---

## Responsibilities

### Map Engine

Responsible for:

- map initialization
- camera movement
- drawing interaction
- event registration
- coordinate conversion

Not responsible for:

- business entities
- application state
- rendering application data

---

### Mobx is the single source of truth for application state.

Mobx is the single source of truth.

All persistent map entities live in Mobx.

Examples:

- markers
- polygons
- rectangles
- circles
- targets
- routes
- tracks

Never store persistent entities inside the map library.

---

### Rendering

Deck.gl is the only renderer for persistent entities.

Rendering pipeline:

Mobx Store
↓

Selectors
↓

Deck.gl Layers
↓

Map

Do not create permanent MapLibre or Leaflet layers for application entities.

Temporary drawing layers created by the drawing library are allowed during editing.

---

## Drawing Lifecycle

Toolbar

↓

IMapEngine.startDraw()

↓

Engine-specific implementation

↓

Geometry created

↓

Convert to GeoJSON-compatible coordinates

↓

Dispatch Redux action

↓

Deck.gl redraw

↓

Remove temporary drawing layer

---

## Engine Isolation

Engine-specific code belongs only inside:

```
map/
    engines/
        maplibre/
        leaflet/
```

Never import MapLibre or Leaflet outside these folders.

---

## Communication Rules

UI

↓

MapEngine

↓

Redux

↓

Deck.gl

Business logic must never communicate directly with MapLibre or Leaflet.

---

## Events

Map events are translated into engine-independent events.

Example:

MapLibre click

↓

IMapEngine.onClick()

↓

Application callback

The application should never know which map engine generated the event.

---

## GeoJSON

All geometry exchanged between the application and the map engine must use GeoJSON-compatible coordinates.

Examples:

Point

```ts
[lng, lat]
```

LineString

```ts
[[lng, lat], ...]
```

Polygon

```ts
[[[lng, lat], ...]]
```

Rectangle

```ts
[
  [west, south],
  [east, north]
]
```

---

## Code Generation Rules

When generating code:

- Never bypass `IMapEngine`.
- Never duplicate engine logic.
- Keep engine implementations interchangeable.
- Keep business logic engine-agnostic.
- Use Mobx as the source of truth.
- Use Deck.gl for rendering persistent entities.
- Prefer composition over inheritance.
- Follow existing abstractions before introducing new ones.