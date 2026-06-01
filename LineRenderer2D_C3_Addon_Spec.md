# Line Renderer 2D — C3 Plugin Specification
### Mesh-Distorted 2D Line Renderer

**Plugin ID:** `studio_linerenderer2d`
**Type:** Plugin — World
**Rendering:** Procedural mesh geometry (dynamic vertex buffer via IWebGLRenderer)
**Category:** Rendering / Effects
**Version:** 1.0.0

---

## Overview

Line Renderer 2D is a world-type plugin that renders smooth, mesh-distorted lines directly on the Construct 3 canvas. It manages a sequence of control points and builds a live triangle-strip mesh between them, giving each line segment its own width, colour tint, UV scroll, and per-vertex distortion offset. The mesh is rebuilt every tick from the current point state, so it responds to physics, gameplay logic, or noise functions in real time without any sprite parenting tricks.

The plugin does **not** move its own control points, apply physics, play animations, or decide what the line means to your game. It is a pure rendering surface. Ropes swing because you update point positions in the event sheet. Laser beams pulse because you drive width with a Sine expression. Lightning branches because you add and remove points in response to your own logic. Line Renderer 2D draws whatever geometry you describe — the meaning is yours.

The design is deliberately narrow: one plugin instance = one line. Multiple lines, multiple instances. This keeps the ACE surface clean, makes it easy to destroy a single line without touching others, and avoids the complexity of a shared line registry. Layering, z-ordering, and grouping are the developer's responsibility via Construct's standard object and layer tools.

---

## The Problem This Addon Solves

Drawing a line in Construct 3 without a plugin means tiling a stretched Sprite along a calculated angle, or spawning a chain of small Sprite segments and rotating each one to point at the next. The first approach breaks on diagonals and sharp bends. The second spawns dozens of objects per line, each needing its own angle calculation, and the seams between segments are always visible at wide widths or shallow angles. Rope, chain, cable, laser, trail, and ribbon effects all suffer from the same root cause: C3's native Sprite is a rectangle, not a curve.

Making that approach data-driven compounds the pain. To give each line segment a varying width, you need per-instance size variables. To animate a glow pulse, you need per-segment tweens or Sine expressions wired to dozens of objects. To apply a ripple distortion, you need to offset every segment's Y position every tick, via a Repeat loop in the event sheet, updating each instance one at a time. Adding a new line means duplicating an entire sub-event tree. Removing one cleanly means destroying a dynamic set of objects and resetting every variable they owned.

Line Renderer 2D replaces all of that with a single world instance and an indexed point list. You call `SetPoint` with a position and width, and the plugin builds the full triangle-strip mesh internally. Distortion, UV scrolling, and colour gradients are parameters on the plugin instance — not loop bodies in your event sheet. A 64-point animated rope is one object, one tick cost, and six event-sheet actions. Scaling to thirty simultaneous ropes means thirty plugin instances; there is no per-segment object count.

---

## Key Design Decisions

**You own the control points — the plugin owns the mesh.** Line Renderer 2D stores a flat list of (x, y, width, colour) tuples that you write with `SetPoint` and `AddPoint`. Every frame it rebuilds the mesh from that list. It does not simulate physics, interpolate smoothly between frames, or predict where points are going. If you want a rope that swings, you update point positions in the event sheet and Line Renderer 2D draws where they are right now.

**Distortion is a per-instance offset layer, not per-vertex manual control.** The plugin's built-in distortion system applies a noise or wave function across all vertices each frame, driven by `DistortAmplitude`, `DistortFrequency`, and `DistortSpeed` properties. It is additive on top of your point positions — your control-point coordinates are never changed by distortion. If you want one segment distorted differently, use two plugin instances.

**Width is per-point, not per-segment.** Each control point carries its own width. The mesh interpolates width linearly between adjacent points. This means a line can taper from thick to thin naturally, but you cannot make a segment wider in the middle than at either end without adding an extra control point.

**UV scrolling runs on the U axis (along the line), not the V axis (across the line).** This makes animated flowing effects — energy beams, moving water, conveyor belts — straightforward with a single `UVScrollSpeed` property. Cross-line texture tiling is fixed at 1:1 across the width. If you need cross-line UV control, use a custom texture that is already tiled as you want it.

**The plugin does not clip to the layout boundary.** The triangle-strip mesh is submitted to the renderer as-is. Vertices outside the viewport are naturally culled by the GPU, but the plugin makes no attempt to trim the mesh at layout edges. This is intentional — trimming would change the vertex count mid-frame and create seams in the UV scroll.

**`PointCount` is the authority on valid indices.** All `SetPoint`, `GetPointX`, `GetPointY`, and `GetPointWidth` calls that receive an out-of-range index are silently no-ops or return 0. The plugin never throws on bad indices. Use `PointCount` in a `Repeat` loop to iterate safely.

**Rebuild skipping is automatic — there is no "static mode" to set.** The plugin tracks an internal dirty flag. Any mutating action (`SetPoint`, `AddPoint`, distortion or appearance changes) marks the mesh dirty, and active distortion or UV scrolling keeps it dirty every tick because those animate the geometry. A line that has stopped changing and is not animating is not rebuilt — the previous vertex buffer is reused. This means a decorative static cable costs almost nothing per tick without the developer configuring anything. The trade-off: `OnMeshRebuilt` only fires on ticks where a real rebuild happened, not every frame.

---

## Key Concepts at a Glance

| Term | What it means |
|---|---|
| **Control Point** | A single anchor in the line's path, defined by world (X, Y) position and a local width; the mesh is built from the sequence of these. |
| **Mesh Strip** | The triangle-strip geometry Line Renderer 2D generates between control points; one quad per inter-point gap, two triangles wide. |
| **Distortion** | A wave or noise offset applied to mesh vertices each frame on top of control-point positions; driven by amplitude, frequency, and speed properties. |
| **UV Scroll** | Continuous movement of the texture coordinates along the line's length; creates flowing animation without moving control points. |
| **Stroke Texture** | The texture assigned to the line's mesh; tiled along the U axis based on line length and `TextureTileLength`. |
| **Coordinate Space** | Whether control points are world coordinates (`absolute`) or offsets from the instance's own transform (`relative`); relative space lets standard C3 movement behaviors drive the whole line. |

---

## Scenarios Where This Addon Excels

- **Procedural ropes and chains** — update control-point Y positions each tick with pendulum or spring logic and Line Renderer 2D renders the continuous mesh; no per-link sprites required.
- **Laser and energy beam effects** — UV scroll on a glow texture with a low-amplitude noise distortion produces a convincing animated beam at any resolution without sprite stretching artifacts.
- **Lightning and arc effects** — randomise control-point X offsets each tick to produce per-frame jitter; vary `DistortAmplitude` on `OnStruck` events for impact pulses.
- **River and road overlays** — place control points along a curve, set a wide uniform width, and apply a scrolling water or asphalt texture; the mesh follows any path without tile-grid constraints.
- **Boss attack patterns** — a homing laser that sweeps by updating the endpoint each tick, visually widening as it charges by incrementing endpoint width via a tween.
- **UI connection lines and node graphs** — low distortion, solid colour tint, thin width; connect two UI nodes with a smooth bezier-sampled point list without any DOM or canvas overlays.
- **Whip and tail animations** — drive control points from a chain of invisible pins, each slightly delayed from the previous using `loopindex * offsetFactor`, producing organic wave-like motion with zero sprite objects.

---

## Example Game Use Cases

### 1. Swinging Rope Bridge (Platformer)
Spawn one Line Renderer 2D per rope segment. Drive each control point's Y position using a simple spring integration computed in a Repeat loop each tick. The rope visually sags and bounces when the player lands on attached platforms. The plugin's `DistortAmplitude` is set to 2 px to add micro-jitter that sells the tension.

### 2. Charged Laser Boss Attack (Bullet Hell)
On "charging" state: gradually increase `EndpointWidth` from 4 to 24 over 1.5 seconds using a tween. On "firing" state: set `UVScrollSpeed` to 800, raise `DistortAmplitude` to 12, and pulse `DistortFrequency` with a Sine expression. The player sees a visually escalating beam without any new objects spawning.

### 3. River with Current Flow (Top-Down Adventure)
Place 12 control points along a curved river path and set them once at Start of Layout. Use a scrolling water texture with `TextureTileLength` tuned so the tiles match the river's visible width. Set `UVScrollSpeed` to 120 and leave distortion at 0 for calm stretches; raise it in rapids areas using a region-overlap check.

### 4. Node Graph UI (Game Editor Tool)
Two Line Renderer 2D instances per connection: one solid grey underline, one narrower coloured overlay driven by signal-flow state. Each connection is built with a single `ConnectObjects(NodeA, NodeB)` call rather than manually reading X/Y, then `SmoothPath` adds a gentle curve. `EndCapStyle` is set to `flat` for clean termination against the node icons. Re-call `ConnectObjects` only when a node is dragged.

### 5. Lightning Between Towers (Tower Defence)
On `OnEnemyInRange`: `Create Line Renderer 2D`, then `ConnectObjects(Tower, Enemy)` and `SmoothPath 6` to subdivide. Drive jagged motion entirely with the built-in distortion (`SetDistortion` amplitude 20, high frequency, fast speed) instead of per-tick `SetPoint` loops — the arc animates itself. On `OnEnemyExiting`: destroy the instance. Per-enemy animated arc with zero persistent objects between waves.

### 6. Whip Weapon Trail (Action Platformer)
A chain of 10 control points driven by a row of invisible pin sprites. Each tick, `SetPointsFromObjects(WhipPin)` rebuilds the whole line from the picked pins in one action — no `Repeat` loop. Width tapers from 14 at index 0 to 2 at the last index via `SetPointWidth` calls at setup. `EndCapStyle` is `round` at both ends.

### 7. Constellation Lines (Puzzle / Hidden Object)
On connecting two star objects: `Create Line Renderer 2D`, `ConnectObjects(StarA, StarB)`, set width 3. Use a sparkle texture with `UVScrollSpeed` 40. On disconnecting: destroy the instance. Because each connection is its own plugin instance, toggling one line has no effect on others.

### 8. DNA Helix Visualiser (Science Education Game)
Two Line Renderer 2D instances with 32 control points each, both following a Sine curve but 180° out of phase with each other. Every 4 points, a thin perpendicular Line Renderer 2D "rung" connects them, driven by the same Sine input. `DistortAmplitude` 0. `UVScrollSpeed` 60 on both strands. The entire helix is 66 plugin instances, zero Sprites.

---

## Properties Panel

| Property | Type | Default | Description |
|---|---|---|---|
| `initialPointCount` | Number | `2` | Number of control points allocated at creation. Minimum 2. Expanding the list later via `AddPoint` is allowed. |
| `strokeTexture` | Image | *(none)* | Texture applied to the mesh surface. If not set, the mesh renders with the current tint colour as a solid fill. |
| `textureTileLength` | Number | `64` | World-space pixel length over which the stroke texture repeats once along the U axis. Lower values tile more frequently. |
| `uvScrollSpeed` | Number | `0` | Pixels per second the texture UV advances along the line length. Positive scrolls from start to end; negative scrolls the reverse direction. |
| `defaultWidth` | Number | `16` | Initial width (in pixels) assigned to all control points at creation. Individual points can be overridden with `SetPoint`. |
| `distortAmplitude` | Number | `0` | Maximum pixel offset applied to mesh vertices by the distortion pass. Zero disables distortion entirely (zero cost). |
| `distortFrequency` | Number | `1.0` | Spatial frequency of the distortion wave — higher values produce more oscillations per unit of line length. |
| `distortSpeed` | Number | `1.0` | Speed multiplier for the distortion phase advance per second. |
| `distortAxis` | Dropdown | `both` | Which screen axis the distortion offset affects: `x_only`, `y_only`, `both`, `perpendicular`. |
| `endCapStyle` | Dropdown | `round` | Shape added at the first and last control points: `round` (semicircle fan), `flat` (no cap), `square` (half-width overhang). |
| `blendMode` | Dropdown | `normal` | WebGL blend mode for the mesh: `normal`, `additive`, `multiply`, `screen`. |
| `samplingMode` | Dropdown | `auto` | Texture sampling: `auto` (inherits from layer), `nearest`, `linear`. |
| `debugPoints` | Boolean | `false` | When enabled, renders a coloured dot at each control point position in the editor and at runtime (useful during layout). |
| `editorPreview` | Dropdown | `wireframe` | Controls what Line Renderer 2D renders in the Layout View: `wireframe` draws the polyline skeleton and control-point dots only; `solid` renders the full mesh strip with per-point widths and colour tints (no UV scroll or distortion); `animated` renders the full mesh and advances UV scroll and distortion phase on each property-change-triggered redraw. |

**Dropdown option keys:**
- `distortAxis`: `x_only`, `y_only`, `both`, `perpendicular`
- `endCapStyle`: `round`, `flat`, `square`
- `blendMode`: `normal`, `additive`, `multiply`, `screen`
- `samplingMode`: `auto`, `nearest`, `linear`
- `editorPreview`: `wireframe`, `solid`, `animated`

---

## Data Structures

### Internal Point Record
Each element in the plugin's `_points` array:
```json
{
  "x":     320.0,
  "y":     240.0,
  "width": 16.0,
  "r":     1.0,
  "g":     1.0,
  "b":     1.0,
  "a":     1.0
}
```
- `x`, `y` — position of the control point (world coordinates in `absolute` space, or instance-relative offsets in `relative` space)
- `width` — half-width of the mesh strip at this point (full stroke is `2 × width`)
- `r`, `g`, `b`, `a` — per-point colour tint stored internally as premultiplied 0–1 floats for the renderer. The ACE surface accepts and returns C3-standard 0–255 RGB and 0–100 opacity; conversion happens at the action/expression boundary.

---

## Built-in End Cap Styles

| Key | Index | Visual |
|---|---|---|
| `round` | 0 | Semicircular fan of 8 triangles centred on the endpoint normal |
| `flat` | 1 | No geometry added; mesh terminates at the last quad edge |
| `square` | 2 | One additional quad extending beyond the endpoint by half the endpoint width |

---

## Actions

### Setup

| Action | Parameters | Description |
|---|---|---|
| `SetPointCount` | count (Number) | Resizes the internal point list to `count` entries. Existing points within range are preserved. New entries are added at (0, 0) with `defaultWidth`. Fires no event. |
| `AddPoint` | x (Number), y (Number), width (Number) | Appends one new control point to the end of the list. Updates `PointCount` by 1. Fires no event. |
| `InsertPoint` | index (Number), x (Number), y (Number), width (Number) | Inserts a new control point at `index`, shifting all subsequent points up by one. Out-of-range index is clamped to 0 or `PointCount`. |
| `RemovePoint` | index (Number) | Removes the control point at `index` and shifts subsequent points down. No-op if index is out of range or if removal would reduce point count below 2. |
| `ClearPoints` | — | Removes all control points except the first two, which are reset to (0, 0) with `defaultWidth`. |

### Point Control

| Action | Parameters | Description |
|---|---|---|
| `SetPoint` | index (Number), x (Number), y (Number), width (Number) | Sets the position and width of the control point at `index`. No-op if index is out of range. |
| `SetPointXY` | index (Number), x (Number), y (Number) | Sets only the position of the control point at `index`, leaving width unchanged. |
| `SetPointWidth` | index (Number), width (Number) | Sets only the width of the control point at `index`, leaving position unchanged. |
| `SetPointColor` | index (Number), r (Number), g (Number), b (Number), opacity (Number) | Sets the colour tint of the control point at `index` using C3-standard 0–255 RGB channels and 0–100 opacity (the same ranges as the system colour picker and `rgbEx`). Converted internally to premultiplied 0–1. The mesh interpolates colour between adjacent points. No-op if index is out of range. |
| `SetAllWidths` | width (Number) | Sets the width of every control point to `width` in a single call. Useful for uniform strokes. |
| `SetAllColors` | r (Number), g (Number), b (Number), opacity (Number) | Sets the colour tint of every control point using 0–255 RGB and 0–100 opacity. |

### Path Building

One-shot helpers that build a whole point list from a high-level shape, so common curves don't need hand-written event-sheet loops. Each rebuilds the point list and marks the mesh dirty.

| Action | Parameters | Description |
|---|---|---|
| `SetLine` | x1 (Number), y1 (Number), x2 (Number), y2 (Number) | Replaces the point list with a straight 2-point line between the two coordinates, keeping the current `defaultWidth`. |
| `BuildBezier` | x1 (Number), y1 (Number), c1x (Number), c1y (Number), c2x (Number), c2y (Number), x2 (Number), y2 (Number), segments (Number) | Samples a cubic Bézier curve into `segments + 1` evenly-parameterised control points. Replaces the existing point list. |
| `BuildArc` | cx (Number), cy (Number), radius (Number), startAngle (Number), endAngle (Number), segments (Number) | Builds an arc of `segments + 1` points around centre (cx, cy). Angles are in degrees, matching C3's angle convention. Use 0–360 for a full circle. |
| `SmoothPath` | subdivisions (Number) | Replaces the current sparse points with a Catmull-Rom spline passing through them, inserting `subdivisions` points between each original pair. Turns a rough hand-placed path into a smooth curve. |
| `ConnectObjects` | from (Object), to (Object) | Builds a 2-point line between the positions of the first picked instance of each object. Accepts families. Snapshots positions at call time — re-call each tick to track moving objects. |

### Object Following

C3-idiomatic helpers that read live object positions instead of raw coordinates. All snapshot the position at call time (no retained references), so the developer keeps explicit control over cost — call once for a static anchor, or each tick to follow.

| Action | Parameters | Description |
|---|---|---|
| `SetPointToObject` | index (Number), object (Object) | Sets control point `index` to the position of the first picked instance of `object`. Accepts families. Width and colour unchanged. |
| `SetPointsFromObjects` | object (Object) | Rebuilds the point list from every picked instance of `object`, one control point per instance, in instance-pick order. Ideal for a line that threads through a set of waypoint sprites. |

### Coordinate Space

| Action | Parameters | Description |
|---|---|---|
| `SetCoordSpace` | space (Dropdown) | Sets how control-point coordinates are interpreted: `absolute` (0, default) treats them as world coordinates; `relative` (1) treats them as offsets from the instance's own X/Y, rotated by the instance angle and scaled by its size. Relative mode lets standard C3 movement behaviors (Sine, Bullet, MoveTo, Tween) and scene-graph hierarchy drive the whole line by moving the Line Renderer 2D object itself. Value arrives as a 0-based index at runtime. |

### Distortion

| Action | Parameters | Description |
|---|---|---|
| `SetDistortion` | amplitude (Number), frequency (Number), speed (Number) | Sets all three distortion parameters simultaneously. Call with amplitude 0 to disable distortion at zero cost. |
| `SetDistortAmplitude` | amplitude (Number) | Updates `DistortAmplitude` property at runtime. Takes effect on the next rendered frame. |
| `SetDistortFrequency` | frequency (Number) | Updates `DistortFrequency` property at runtime. |
| `SetDistortSpeed` | speed (Number) | Updates `DistortSpeed` property at runtime. |
| `SetDistortAxis` | axis (Dropdown) | Sets which axis distortion offsets apply to: `x_only` (0), `y_only` (1), `both` (2), `perpendicular` (3). Value arrives as a 0-based index at runtime. |

### Appearance

| Action | Parameters | Description |
|---|---|---|
| `SetUVScrollSpeed` | speed (Number) | Sets the UV scroll speed in pixels per second. Positive scrolls start-to-end; negative scrolls end-to-start. |
| `SetTextureTileLength` | length (Number) | Sets the world-space pixel span per texture repeat. Must be greater than zero. |
| `SetBlendMode` | mode (Dropdown) | Sets the WebGL blend mode: `normal` (0), `additive` (1), `multiply` (2), `screen` (3). Value arrives as a 0-based index at runtime. |
| `SetEndCapStyle` | style (Dropdown) | Sets the end cap shape: `round` (0), `flat` (1), `square` (2). Value arrives as a 0-based index at runtime. |
| `SetOpacity` | opacity (Number) | Sets the master opacity of the entire stroke (0–100). Applied on top of per-point alpha values. |

### Performance

| Action | Parameters | Description |
|---|---|---|
| `SetRenderLOD` | maxPoints (Number) | Caps the number of control points used to build the rendered mesh. The full `_points` list is sampled at even intervals down to `maxPoints` (first and last points always kept). Pass 0 to disable LOD and render all points. Useful for distant or small-on-screen lines. Marks the mesh dirty. |
| `SetDistortResolution` | subdivisions (Number) | Sets how many vertex pairs are generated per segment for the distortion pass. `1` (default) places distorted vertices only at control points; higher values insert intermediate vertices for smoother ripple curves at the cost of vertex count. Clamped to a minimum of 1. Marks the mesh dirty. |
| `SetFrustumCulling` | enabled (Boolean) | Enables or disables off-screen culling. When enabled, the mesh rebuild and draw call are skipped entirely on any tick where the control-point bounding box lies fully outside the viewport. Disabled by default. |

---

## Conditions

### Events

| Condition | Notes |
|---|---|
| `OnMeshRebuilt` | Fires on any tick where the triangle-strip mesh was actually recalculated — not every frame. A static line that did not change and is not animating its UV or distortion is not rebuilt, so this does not fire (see the Automatic Rebuild Skipping design decision). Use `VertexCount` and `LineLength` expressions inside this trigger. |
| `OnPointCountChanged` | Fires when `AddPoint`, `RemovePoint`, `SetPointCount`, or `ClearPoints` changes the number of control points. Use `PointCount` expression inside this trigger. |

### State Checks

| Condition | Parameters | Description |
|---|---|---|
| `IsPointIndexValid` | index (Number) | True if `index` is within 0 and `PointCount − 1` inclusive. |
| `IsDistortionActive` | — | True if `DistortAmplitude` is greater than zero. |
| `IsUVScrolling` | — | True if `UVScrollSpeed` is non-zero. |
| `IsTextureAssigned` | — | True if a stroke texture has been assigned to this instance (not the default solid-fill mode). |
| `HasMinimumPoints` | minCount (Number) | True if `PointCount` is greater than or equal to `minCount`. Useful for guard conditions before building complex line shapes. |
| `IsCulled` | — | True if frustum culling is enabled and the line was skipped on the last tick because its bounding box was fully off-screen. |
| `IsLODActive` | — | True if a render LOD cap is set (greater than 0) and is currently below `PointCount` — i.e. the rendered mesh is using fewer points than the full list. |
| `IsRelativeSpace` | — | True if the coordinate space is set to `relative` (control points are offsets from the instance origin rather than world coordinates). |

---

## Expressions

| Expression | Returns | Description |
|---|---|---|
| `PointCount` | Number | Total number of control points in the current list. |
| `GetPointX(index)` | Number | World-space X position of the control point at `index`. Returns 0 if index is out of range. |
| `GetPointY(index)` | Number | World-space Y position of the control point at `index`. Returns 0 if index is out of range. |
| `GetPointWidth(index)` | Number | Width value of the control point at `index`. Returns 0 if index is out of range. |
| `GetPointR(index)` | Number | Red channel (0–255) of the colour tint at the control point at `index`. |
| `GetPointG(index)` | Number | Green channel (0–255) of the colour tint at the control point at `index`. |
| `GetPointB(index)` | Number | Blue channel (0–255) of the colour tint at the control point at `index`. |
| `GetPointOpacity(index)` | Number | Opacity (0–100) of the control point at `index`. |
| `LineLength` | Number | Accumulated world-space length of the polyline formed by all control points, in pixels. Meaningful inside `OnMeshRebuilt`. |
| `VertexCount` | Number | Number of vertices in the last-built triangle-strip mesh. Equals `((RenderedPointCount − 1) × DistortResolution + 1) × 2 + (end-cap fan vertices)`. Meaningful inside `OnMeshRebuilt`. |
| `RenderedPointCount` | Number | Number of control points actually used to build the last mesh. Equals `PointCount` when no LOD cap is active, or the LOD cap when one is set. |
| `RenderLOD` | Number | Current render LOD cap. Returns 0 when LOD is disabled (all points rendered). |
| `DistortResolution` | Number | Current distortion subdivision count (vertex pairs generated per segment). Minimum 1. |
| `DistortAmplitude` | Number | Current distortion amplitude property value in pixels. |
| `DistortFrequency` | Number | Current distortion frequency property value. |
| `DistortSpeed` | Number | Current distortion speed multiplier. |
| `UVScrollSpeed` | Number | Current UV scroll speed in pixels per second. |
| `UVScrollOffset` | Number | Accumulated UV scroll distance since layout start, in pixels. Useful for synchronising multiple line instances. |
| `TextureTileLength` | Number | Current world-space pixel span per texture repeat. |
| `CoordSpace` | String | Current coordinate space: `"absolute"` or `"relative"`. |

---

## Debugger Support

Line Renderer 2D exposes a debugger section titled **"Line Renderer 2D"** in C3's runtime debugger panel. All property keys are prefixed with `$` per C3 convention.

| Debugger Property | Description |
|---|---|
| `$pointCount` | Current number of control points. |
| `$vertexCount` | Number of vertices in the last-built mesh. |
| `$lineLength` | Accumulated polyline length in pixels. |
| `$distortAmplitude` | Live distortion amplitude. |
| `$uvScrollOffset` | Current accumulated scroll offset. |
| `$blendMode` | Active blend mode as a human-readable string. |
| `$meshRebuildCount` | Running total of mesh rebuilds since layout start. Useful for detecting per-tick mesh churn on high-point-count lines. |
| `$lastTickRebuilt` | Whether the mesh was rebuilt on the most recent tick — `false` indicates the dirty-flag skip path was taken. |
| `$renderLOD` | Active render LOD cap, or "off" when disabled. |
| `$renderedPointCount` | Control points used in the last mesh build (after LOD sampling). |
| `$distortResolution` | Current distortion subdivision count. |
| `$isCulled` | Whether the line was culled off-screen on the last tick. |
| `$coordSpace` | Active coordinate space (`absolute` or `relative`). |

---

## Architecture & Design Notes

**Rendering Model.** Line Renderer 2D is a World plugin. Its editor `Draw(iRenderer, iDrawParams)` method renders one of three visuals depending on the `editorPreview` property (see **Editor Preview** note below). At runtime, rendering uses the IWebGLRenderer pipeline: `SetAlphaBlendMode()` → texture check → `SetTextureFillMode()` + `SetTexture()` + `ResetColor()` → `DrawTriangleStrip(vertices)`. The mesh is a plain flat `Float32Array` containing interleaved position (x, y), UV (u, v), and colour (r, g, b, a) per vertex. State setup order matches the four-step IWebGLRenderer model exactly.

**Editor Preview.** The editor `Draw(iRenderer, iDrawParams)` call supports three preview modes controlled by the `editorPreview` property:

- **`wireframe` (default):** Draws the polyline skeleton using `SetColorFillMode()` + repeated `Line()` calls between consecutive control points. If `debugPoints` is enabled, a filled circle is drawn at each control point using `Rect()` with a small bounding square. This is the cheapest editor path and is always safe to use — it has no dependency on texture load state.

- **`solid`:** Runs the same mesh-build pass as the runtime tick (bisector normals, per-point width, colour interpolation, end caps) and submits the resulting triangle strip with `DrawTriangleStrip()`. UV coordinates are computed from cumulative arc length and `textureTileLength` but `_uvScrollOffset` is fixed at 0 — the texture is shown un-scrolled. Distortion amplitude is treated as 0 in this path regardless of the property value. This gives an accurate shape and width preview without any animated state. If the stroke texture is not yet loaded, the mesh falls back to `SetColorFillMode()` with the first control point's colour tint.

- **`animated`:** Runs the full mesh-build pass including UV scroll offset and distortion. The scroll offset and distortion phase used in the editor are stored in separate editor-only state variables (`_editorUvOffset`, `_editorDistortPhase`) that are completely independent of the runtime `_uvScrollOffset` and `_distortPhase` — they must never be shared. The editor variables advance by a fixed wall-clock step (e.g. `1/30` second) each time `Draw()` is called, **not** from `iDrawParams.GetDt()` which is unreliable outside continuous drag operations. After advancing state, `Draw()` calls `this._inst.GetLayoutView().Refresh()` exactly once to schedule the next redraw — this produces a self-sustaining animation loop driven by `Refresh()` → `Draw()` → `Refresh()`. **This loop must be gated:** `Refresh()` is only called if `editorPreview === "animated"` and the instance is currently selected or the Layout View has animation enabled. Unconditional `Refresh()` calls from every instance at every draw would burn CPU on layouts with many Line Renderer 2D objects. When `editorPreview` is changed away from `animated`, the loop terminates naturally because the next `Draw()` call will not issue a further `Refresh()`.

Note that `iDrawParams.GetDt()` is explicitly **not** used for advancing animated preview state — it returns a reliable value only when the user is actively dragging near the viewport edge, and is a dummy non-zero constant otherwise. The fixed wall-clock step in `animated` mode produces a consistent preview speed regardless of editor activity.

**Mesh Rebuild Strategy.** The triangle-strip mesh is rebuilt in `_tick()` only when the `_meshDirty` flag is set — by a mutating action, or unconditionally when distortion amplitude is non-zero or UV scroll speed is non-zero (since those animate the geometry every frame). When clean, the previous vertex buffer is reused and no rebuild work runs. A rebuild iterates the rendered point set (the full `_points` list, or an evenly-sampled subset when a render LOD cap is active) and computes perpendicular normals at each interior point using the bisector of its two adjacent segments. End points use the single-segment normal. Each rendered point emits two vertices (left and right edges). The UV U coordinate at each point is the cumulative polyline length divided by `textureTileLength`, giving correct texture projection regardless of line curvature. The V coordinate is 0.0 at the left edge and 1.0 at the right edge. Distortion offsets are applied to each vertex after UV assignment, so UV coordinates are always undistorted — the texture appears to stretch and twist with the mesh rather than sliding independently. The distortion phase advances by `distortSpeed × this.instance.dt` per tick and is stored in `_distortPhase`; this value is serialised in `_saveToJson()` so UV scroll and distortion stay visually continuous after a save/load cycle. `this.instance.dt` is used rather than `this.runtime.dt` so that each Line Renderer 2D instance honours its own time-scale — if the instance is paused, time-scaled, or pinned to a time-affected layer, `this.instance.dt` reflects that correctly while `this.runtime.dt` would not.

**Per-Vertex Distortion Implementation.** The distortion pass iterates the rebuilt vertex array and adds a noise offset to each vertex position. The offset is computed as `amplitude × sin(frequency × arcLength + phase)` for wave mode, where `arcLength` is the cumulative length to that vertex and `phase` is `_distortPhase`. For `x_only` and `y_only` axes, only that component is modified. For `perpendicular`, the offset is applied along the per-vertex edge normal rather than a screen axis, producing a ribbon-flutter effect that is independent of line orientation. When `DistortResolution` is greater than 1, the rebuild inserts that many evenly-spaced vertex pairs along each segment before the distortion pass runs, so the sine curve is sampled more finely and the ripple reads as a smooth curve rather than straight chords between control points. This decouples shape fidelity (how many control points you need) from distortion smoothness (how many vertices the wave is sampled at). Developers should not attempt to counteract distortion in their own control-point logic — distortion is purely cosmetic and does not change the values returned by `GetPointX` / `GetPointY`.

**Initialisation Order.** The `_points` array is initialised in `constructor()` from `initialPointCount`, populating each entry with `(0, 0, defaultWidth, 1, 1, 1, 1)`. The `_meshBuffer` Float32Array is also allocated in `constructor()` at `initialPointCount × 2 × 8` floats (8 floats per vertex: x, y, u, v, r, g, b, a). Both are resized lazily in `_tick()` if `PointCount` has changed since the last rebuild. The `strokeTexture` handle is resolved in `onCreate()` by calling `this.runtime.getAssetManager().getTexture(...)`. C3 may fire `SetPoint` actions before `onCreate()` fires (e.g. placed in a sub-event of `At start of layout` — initialising `_points` in `constructor()` prevents null-pointer errors in those early ACE calls.

**UV Scroll Accumulation.** `_uvScrollOffset` accumulates as `uvScrollSpeed × this.instance.dt` per tick, without clamping. Using `this.instance.dt` (rather than `this.runtime.dt`) means the scroll correctly pauses or slows when the instance is time-scaled or the layout applies a time-scale effect — a beam that visually freezes during a slow-motion moment without a single extra event-sheet condition. The value grows unboundedly for the lifetime of the instance; this is intentional — clamping to the tile length would introduce a visible UV seam every full cycle on textured meshes. On long-running layouts the value grows large but remains valid for `float` precision up to many hours of continuous scrolling at any practical scroll speed.

**Multiple Instances and Z-Order.** Each Line Renderer 2D instance is an independent world object. Z-order, layer assignment, and blending relative to other objects are controlled via Construct's standard layer and Z-order system — the same as any Sprite. There is no shared state between instances. Creating 50 simultaneous lines creates 50 independent `_points` arrays and `_meshBuffer` allocations. If memory is a concern for very high point counts, the developer should call `SetPointCount` to trim unused tail entries rather than leaving the buffer over-allocated.

**Performance Model.** Line Renderer 2D favours automatic optimisation over configuration, keeping the Properties panel small. Four mechanisms work together, three of them ACE-driven so they cost nothing on lines that do not use them:

- **Dirty-flag rebuild skipping (automatic).** Static, non-animating lines reuse their last vertex buffer instead of rebuilding. No setup required — see the Mesh Rebuild Strategy note.
- **Frustum culling (`SetFrustumCulling`).** When enabled, a cheap O(n) bounding-box test against the viewport skips both the rebuild and the draw call for fully off-screen lines. Off by default because some games intentionally keep off-screen lines warm. The `IsCulled` condition and `$isCulled` debugger field report the live state.
- **Render LOD (`SetRenderLOD`).** Caps rendered point count by evenly sampling the full `_points` list, keeping first and last points. The data is never lost — only the rendered mesh is simplified — so raising or removing the cap later restores full fidelity. `RenderedPointCount` reports the effective count.
- **Distortion resolution (`SetDistortResolution`).** Trades vertex count for ripple smoothness independently of control-point count, so a 4-point beam can still show a smooth high-frequency wave without adding control points the developer would otherwise have to manage by hand.

All four feed the same `VertexCount` accounting, so the debugger's `$lastTickRebuilt`, `$renderedPointCount`, and `$meshRebuildCount` fields together give a complete picture of per-instance cost when profiling.

**Coordinate Space & Movement Behaviors.** In `absolute` space (default) control points are world coordinates — the simplest mental model, and what most beam/lightning effects want. In `relative` space the renderer transforms each point through the instance's position, angle, and size before building the mesh, so the line becomes a rigid shape attached to the object's transform. This is the key to reusing C3's existing toolkit: drop a Sine, Bullet, MoveTo, or Tween behavior on the Line Renderer 2D object and the whole line moves, rotates, and scales with it; make the Line Renderer 2D object a child in a scene-graph hierarchy and it inherits the parent's transform. The developer builds the line shape once in local space and then animates it with tools they already know, instead of recomputing every control point each tick. Switching space does not rewrite stored coordinates — it only changes how they are interpreted at render time, so the same point list can be flipped between world-anchored and object-anchored behaviour.

**Object Parameters & Picking.** The `ConnectObjects`, `SetPointToObject`, and `SetPointsFromObjects` actions take C3 `Object` parameters, which resolve to the instances currently picked in the event sheet's scope (SOL). This follows standard C3 semantics: a developer can filter with a `Pick` condition first, and the action operates on exactly those instances. `SetPointsFromObjects` reads them in pick order. All three accept Families, so a line can thread through a heterogeneous set of objects sharing a family. Positions are snapshotted at call time and no object reference is retained — if an object is destroyed after the call, the line is unaffected, and tracking a moving object is an explicit per-tick re-call rather than a hidden subscription.

**Worker-Mode Safe.** The plugin is compatible with C3's default Web Worker export mode. All runtime logic operates on plain numbers, `Float32Array` mesh buffers, and the IWebGLRenderer interface — none of which touch DOM types. The stroke texture is resolved through C3's asset manager rather than an `HTMLImageElement`, so no DOM-only data type crosses the worker boundary. No special configuration is required for worker-mode projects.

**Create at Runtime.** Because the `_points` array and mesh buffer are allocated in `constructor()`, a Line Renderer 2D object spawned with the system `Create object` action is immediately ready to receive `SetPoint`, `BuildBezier`, or `ConnectObjects` calls in the same tick — there is no deferred initialisation step. The typical runtime pattern is: `Create Line Renderer 2D` → set its layer/position if using relative space → call a Path Building action → done. This makes per-effect lines (a lightning bolt per enemy, a tether per grabbed object) a clean create-configure-destroy lifecycle.

**Serialisation.** `_saveToJson()` serialises the full `_points` array (all fields), `_uvScrollOffset`, `_distortPhase`, and all runtime-mutable state: `distortAmplitude`, `distortFrequency`, `distortSpeed`, `uvScrollSpeed`, `textureTileLength`, `blendMode`, `endCapStyle`, plus the performance settings `_renderLOD`, `_distortResolution`, and `_frustumCullingEnabled`. `_loadFromJson()` restores all of these and marks the mesh buffer dirty for rebuild on the next tick. This makes the plugin compatible with C3's snapshot-rollback netcode — all state that affects rendering is captured in the snapshot.

**Dynamic Texture UV — `GetTexRect()`.** Because Construct may pack the stroke texture into an atlas, UV coordinates must use `GetTexRect()` to retrieve the correct sub-rectangle within the atlas. The mesh UV values are computed in normalised 0–1 space first and then remapped into the atlas sub-rect each frame. Hardcoding `0, 0, 1, 1` as UV would render the entire atlas sheet, not the intended texture.

**Cross-Plugin Compatibility — Line Renderer 3D.** Line Renderer 2D is the flat-plane member of a two-plugin family; its sibling **Line Renderer 3D** (`studio_linerenderer3d`) handles per-point Z, oriented ribbons, and tube extrusion in a 3D scene. The two share the same conceptual model — an indexed control-point list with per-point width and colour, the same Path Building and Object Following action shapes, and the same dirty-flag rebuild model — so event-sheet logic ports between them with minimal change. They are independent object types: instances are not interchangeable, and a point list is not transferable between a 2D and a 3D instance at runtime. Use Line Renderer 2D for anything that lives on the layout plane (UI, top-down, side-scrollers, HUD overlays) — it is cheaper, has no camera dependency, and never pays the depth-sorting cost. Reach for Line Renderer 3D only when a line genuinely needs to occupy 3D space.

---

*Line Renderer 2D v1.0.0 — Plugin Specification*
