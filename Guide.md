# Line Renderer Guide

Line Renderer is a Construct 3 **behavior** for **Sprite** and **Tiled Background** objects. Add it to an object and that object becomes a procedural line: a rope, a beam, a trail, a river, a cable or a UI connector, built from a list of **control points** you edit from events. The behavior does not draw anything itself. It rewrites the host object's **mesh** every time the line changes, so Construct keeps drawing the host with its own image, animation frames, opacity, color, blend mode, effects, Z order and collision polygon. You get one object per line, no chains of rotated sprite segments, and full event-sheet control over shape, width, texture tiling and distortion.

> **Version 2 changed the addon from a world plugin into a behavior.** Old "Line Renderer 2D" objects are not converted automatically. Replace each one with a Tiled Background (or Sprite) that carries the Line Renderer behavior, paint the line image on that object, and re-add the point and path actions under the behavior. Per-point color and the editor preview are gone: the host object now provides all appearance, and Construct meshes have no per-vertex color.

## Table of Contents

1. [Scenarios Where This Addon Excels](#1-scenarios-where-this-addon-excels)
2. [Core Concepts](#2-core-concepts)
3. [Project Setup](#3-project-setup)
4. [Behavior Properties](#4-behavior-properties)
5. [Managing Points](#5-managing-points)
6. [Path Building and Object Linking](#6-path-building-and-object-linking)
7. [Coordinate Space and Auto-Fit](#7-coordinate-space-and-auto-fit)
8. [Texture Mapping and Scrolling](#8-texture-mapping-and-scrolling)
9. [Distortion, Caps and 3D Facing](#9-distortion-caps-and-3d-facing)
10. [Performance Controls](#10-performance-controls)
11. [Actions Reference](#11-actions-reference)
12. [Conditions Reference](#12-conditions-reference)
13. [Expressions Reference](#13-expressions-reference)
14. [Triggers Reference](#14-triggers-reference)
15. [System Use Cases](#15-system-use-cases)
16. [Game Use Cases](#16-game-use-cases)
17. [C3 Debugger](#17-c3-debugger)
18. [Scripting (C3 Script / JavaScript)](#18-scripting-c3-script--javascript)
19. [Feature Deep-Dive: How the Mesh Works](#19-feature-deep-dive-how-the-mesh-works)
20. [Tips and Common Mistakes](#20-tips-and-common-mistakes)

## 1. Scenarios Where This Addon Excels

- **Ropes and cables between moving objects**: Connect two objects, or a whole picked list, and the line follows them every tick.
- **Lasers and energy beams**: A Tiled Background with a glow image, a scrolling texture and a little distortion makes an animated beam with no seams.
- **Rivers, roads and conveyor belts**: Tile a texture along a curved path at a fixed pixel density and scroll it to show flow.
- **Node-graph and UI connectors**: Draw clean bezier links between draggable panels using the same object type for every link.
- **Lightning and magic arcs**: Smooth a jagged path and animate the distortion wave for a living, crackling effect.
- **3D wires and tapes**: Points carry a Z offset and the ribbon can face the camera or twist as a flat tape in 3D layouts.
- **Anything a Sprite can do, on a line**: Because the host is a normal object, animations, effects, families, containers and collisions all keep working.

## 2. Core Concepts

### The problem this addon solves

Without a mesh line system you place many rotated sprites to fake a curve. That costs objects, shows seams at joins, and every visual tweak means touching every segment. Line Renderer keeps **one object per line** and rebuilds the host's mesh from a **control point** list, so the whole stroke is a single textured strip.

### Key design decisions

- **The host draws, the behavior shapes.** The behavior only writes mesh points. Image, color, opacity, blend mode, effects and Z order stay on the host object where Construct expects them.
- **Points live in your events.** The behavior does not simulate rope physics. You decide where points go; it renders them.
- **Relative space by default.** Points are object-local pixels, so a freshly added behavior renders the object across its own box and follows the object's position, angle and size.
- **One behavior per object.** The behavior owns the mesh, so Construct allows only one Line Renderer per object.
- **Safe indices.** Out-of-range point indices are ignored, never crash events.

### Key concepts at a glance

| Concept | Meaning |
|---|---|
| **Control point** | A point with x, y, z and a half-thickness `width`. The line passes through every point in order. |
| **Host object** | The Sprite or Tiled Background the behavior is attached to. It provides the image and everything visual. |
| **Mesh column** | One sample along the line, with a left and right vertex. The host mesh is columns x 2. |
| **Co-ordinate space** | Relative (object-local pixels that follow the object) or Absolute (layout co-ordinates). |
| **Distortion** | A sine wave offset applied along the line, animated over time. |

## 3. Project Setup

1. Install the addon (`salmanshh_line_renderer-2.0.0.0.c3addon`) through the Addon Manager and restart Construct.
2. Add a **Tiled Background** to your layout. Paint or import the image you want along the line (a rope, a glow strip, a dashed pattern). For most lines a wide, short image works best: the image height maps across the ribbon, the image width repeats along it.
3. Add the **Line Renderer** behavior to the object. The default properties render the object exactly across its own box, so nothing looks different until you edit points.
4. Optionally use a **Sprite** instead. Sprites work the same way, except the image is always stretched once along the line (spritesheets cannot tile).
5. Drive the points from events:

```
Event: System -> On start of layout
  Action: Rope: Set co-ordinate space -> Absolute
  Action: Rope: Set line between objects -> Anchor, Hook
  // two-point line between the first picked Anchor and Hook

Event: System -> Every tick
  Action: Rope: Set point to object -> 0, Anchor
  Action: Rope: Set point to object -> 1, Hook
  // keep both ends attached as the objects move
```

## 4. Behavior Properties

| Property | Type | Default | Description |
|---|---|---|---|
| Initial point count | integer | 2 | Points created at start, spread across the object's box so it looks unchanged. |
| Co-ordinate space | combo | Relative | Relative: object-local pixels that follow the object. Absolute: layout co-ordinates that ignore the object's transform. |
| Texture scroll speed | float | 0 | Pixels per second the image scrolls along the line (Tiled Background only). |
| End caps | combo | Round | None (cut at the endpoint), Square or Round ends; Square and Round extend by half the thickness. |
| Joins | combo | Round | Simple, Miter, Bevel or Round corners between segments. |
| Cross-section points | integer | 2 | 2 draws a flat ribbon; 3 to 32 wraps the image around a 3D tube. |
| Facing | combo | Flat | Flat (2D), Billboard (face the 3D camera) or Up vector (3D tape). |
| Distortion amplitude | float | 0 | Maximum pixel offset of the distortion wave. 0 disables distortion. |
| Distortion frequency | float | 1 | Spatial frequency of the wave along the line. |
| Distortion speed | float | 1 | How fast the wave phase advances. |
| Distortion axis | combo | Both | X only, Y only, Both, Perpendicular or Z only. |
| Distortion resolution | integer | 1 | Mesh subdivisions per segment. Raise it for smooth waves on long segments. |
| Auto-fit to line | check | false | Absolute space only: move and resize the object so its box covers the line after every rebuild. |
| Enabled | check | true | Whether the behavior is initially enabled. When disabled the object is drawn normally. |

The properties are read once when the instance is created. Everything they set can also be changed at runtime with the matching action.

Several things are deliberately not properties because the host object already defines them: the **image** and its animation, the **texture mapping** (Tiled Backgrounds tile at their native density, Sprites stretch their frame once), the **line thickness** used by path-building actions (half the object's height at creation), and opacity, color, blend mode and effects.

## 5. Managing Points

A line is a list of at least two **control points**. Each point has an X and Y position, an optional Z offset and a **width**, which is the half-thickness of the ribbon at that point. Widths interpolate between points, so a line from width 16 to width 0 tapers to a tip.

```
Event: System -> On start of layout
  Action: Trail: Set point count -> 5
  Action: Trail: Set point -> 0, 0, 0, 12
  Action: Trail: Set point -> 1, 40, -10, 10
  Action: Trail: Set point -> 2, 80, 0, 8
  Action: Trail: Set point -> 3, 120, 10, 4
  Action: Trail: Set point -> 4, 160, 0, 0
  // widths taper from 12 to 0 for a comet tail
```

Add, insert and remove points change the count and fire **On point count changed**. Remove point refuses to go below two points. Set point count grows the list with points at (0, 0) or truncates it.

Gotchas:

- Widths are half-thickness. A rope that should look 20 pixels wide uses width 10.
- Two consecutive points at the same position produce a zero-length segment. The behavior tolerates it, but the tangent there is guessed from neighbours, so avoid it for clean caps.

## 6. Path Building and Object Linking

The path-building actions replace the whole point list in one go, using half the object's height (its height at creation) as the width of every point.

| Action | What it builds |
|---|---|
| Set line | Two points, a straight segment. |
| Set line with Z elevation | Two points with Z offsets. |
| Set arc | Points along a circle segment between two angles. |
| Set bezier curve | Points sampled along a cubic bezier. |
| Set line between objects | Two points at the first picked instance of each object. |
| Set points from objects | One point per picked instance, in picking order. |
| Smooth line | Replaces the list with a Catmull-Rom spline through the existing points. |

```
Event: Mouse -> On left button clicked
  Action: Link: Set co-ordinate space -> Absolute
  Action: Link: Set bezier curve -> NodeA.X, NodeA.Y, NodeA.X + 120, NodeA.Y, NodeB.X - 120, NodeB.Y, NodeB.X, NodeB.Y, 12
  // an S-curve connector with 12 segments
```

**Set point to object** updates one existing point from an object and is the tool for following moving anchors every tick. **Set points from objects** rebuilds the list from a picked set, which is ideal for chains of physics segments: pick the chain links in order and the line passes through all of them.

## 7. Coordinate Space and Auto-Fit

**Relative** space (the default) treats point co-ordinates as pixels from the object's origin, before rotation and scale. Move, rotate or resize the object and the line follows, exactly like the image on a plain Tiled Background. Resizing scales the line by the ratio to the object's size at creation. This mode is the right one when the line is a fixed decoration of the object.

**Absolute** space treats point co-ordinates as layout co-ordinates. The object's position, angle and size no longer move the line. This mode is the right one for ropes and connectors that attach to other objects.

In absolute space the line usually extends far outside the host's small box. Construct still draws mesh points outside the box, but the object's bounding box, on-screen check and collision polygon are based on the box. Turn on **Auto-fit to line** (or call **Fit object to line**) and the behavior moves and resizes the object to cover the line after every rebuild, keeping culling and collisions correct.

```
Event: System -> On start of layout
  Action: Rope: Set co-ordinate space -> Absolute
  Action: Rope: Set auto-fit to line -> true
  // the Rope object box now always covers the stroke
```

Auto-fit is ignored in relative space, because in that mode the object's box is what defines the line.

## 8. Texture Mapping and Scrolling

There is nothing to configure here: texture mapping is derived from the host object, and the goal is that the default ribbon looks exactly like the un-bent object. Texture co-ordinates run along the distance of the line, and across the ribbon they cover the same image area the object's height would.

**Tiled Background hosts tile.** The image repeats at its native density, one repeat per image width (times the host's **Image scale** property), no matter how long the line is. Change the tile density with the Tiled Background's own Image scale, and the line thickness with the object's height. Repeat wrapping keeps long ropes crisp and makes scrolling possible: **Texture scroll speed** moves the image along the line in pixels per second.

**Sprite hosts stretch.** A Sprite frame is one region of a spritesheet, so texture co-ordinates must stay inside it. The frame is fitted exactly once from start to end, and texture scrolling has no effect.

```
Event: System -> On start of layout
  Action: Beam: Set texture scroll speed -> 200
  // beam energy visibly flows from start to end (Beam is a Tiled Background)
```

## 9. Distortion, Caps and 3D Facing

**Distortion** offsets every mesh sample by `amplitude * sin(frequency * distance + phase)`, where the phase advances by **Distortion speed** per second. **Distortion axis** picks the direction: X, Y, both, perpendicular to the line, or Z for 3D wobble. Raise **Distortion resolution** to add samples between control points; a wave with frequency 0.2 on a 400 pixel segment needs several subdivisions to look smooth.

```
Event: System -> On start of layout
  Action: Lightning: Set distortion -> 6, 0.35, 12
  Action: Lightning: Set distortion axis -> Perpendicular
  Action: Lightning: Set distortion resolution -> 6
```

**End caps** controls both ends of the line:

| Cap | Look |
|---|---|
| None (flat) | The line is cut off exactly at the endpoint. |
| Square | The line extends past the endpoint by half its thickness with a flat end. |
| Round | The line extends past the endpoint by half its thickness with a rounded end (four extra mesh columns per end). |

**Joins** controls the corners between segments:

| Join | Look | Cost |
|---|---|---|
| Simple | One mesh column on the corner bisector at the nominal width, so sharp corners get thinner. Fine for dense point lists. | Cheapest. |
| Miter | The corner column is stretched to the edges' intersection, giving a sharp point. Corners sharper than the miter limit (4x the half-width) fall back to Bevel so nothing shoots off to infinity. | Same as Simple. |
| Bevel | The outer corner is chipped flat between the two segments' edges. | One extra column per corner. |
| Round | The outer corner is swept in an arc. | Up to eight extra columns per corner, scaled by the turn angle. |

For Bevel and Round the inner side of the corner shares a single vertex at the inner intersection, so translucent images do not double-draw at joins.

```
Event: System -> On start of layout
  Action: Rope: Set end caps -> Round
  Action: Rope: Set joins -> Round
```

### Working in 3D

The behavior follows the same approach as the Trail Renderer: every vertex carries a real Z, the host object is treated as a canvas, and Construct draws the result with the host's Z elevation and 3D camera. Nothing changes for 2D projects; all Z values default to 0.

**Point Z.** In Relative space a point's Z is an offset from the host's Z elevation, so the line rises and falls with the object. In Absolute space a point's Z is layout Z, exactly like its X and Y. Use **Set point Z elevation**, **Set point position with Z elevation**, **Add point with Z elevation** or **Set line with Z elevation**, or let the object-following actions read Z from other instances: **Set point to object**, **Set line between objects** and **Set points from objects** all take the target's total Z elevation and convert it into the current co-ordinate space.

**Attach points.** **Set point to image point** reads a named image point (with its Z on r496 and later), or a face image point of a 3D Shape when you pick a face. **Set point to 3D model node** reads the world position of a mesh or bone node of a 3D Model object. Both feature-detect the runtime API and fall back to the instance position on older runtimes.

**Facing** controls how the width is oriented. Flat keeps the ribbon in the layout plane, which is right for lines on the ground. Billboard turns the width toward the camera. Up vector makes a tape perpendicular to the world up axis that twists as the line climbs. **Set billboard camera** chooses the camera: Automatic finds the project's 3D Camera object (by name, or any object exposing a camera position), Manual takes an X, Y, Z you supply, for example from the 3D Camera's own expressions. **Set up vector** changes the up axis for Up vector facing.

**Tubes.** **Cross-section points** turns the flat ribbon into a tube. With 2 points the line is a ribbon; with 3 or more, the image is wrapped around a tube with that many points around it (the mesh gets one extra row for the seam). Tubes look right from any camera angle, so they do not need billboard facing. Round caps become rounded ends, distortion moves the whole ring, and joins fall back to Simple because a ring needs a centre. Six to twelve points make a convincing cable.

```
Event: System -> On start of layout
  Action: Cable: Set co-ordinate space -> Absolute
  Action: Cable: Set auto-fit to line -> true
  Action: Cable: Set cross-section points -> 8
  Action: Cable: Set line with Z elevation -> PoleA.X, PoleA.Y, 200, PoleB.X, PoleB.Y, 260
```

**Auto-fit in 3D.** With auto-fit on (Absolute space), the host is resized to cover the line, its own Z elevation is lowered to the lowest vertex so Z sorting matches the line and all mesh offsets stay positive, and any 3D rotation on the host is cleared so mesh points are written in layout space. This mirrors the Trail Renderer's host handling. In Relative space the host keeps its rotation and the line rotates with it.

## 10. Performance Controls

- **Set maximum drawn points** caps how many control points feed the mesh. With 200 points and LOD 40, the mesh uses 40 evenly spread points. The behavior additionally caps the mesh at 1024 columns.
- **Set distortion resolution** adds columns per segment. Keep it at 1 unless distortion needs it.
- **Set off-screen culling** skips rebuilding while the line's bounds are outside the layer viewport. The last mesh stays on the host.
- The mesh is only rebuilt when something changed: points, settings, the host transform (absolute space) or size (relative space), and every tick while distortion or scrolling is active.

## 11. Actions Reference

### Setup

| Action | Description |
|---|---|
| Set enabled | Turn line generation on or off. Off releases the mesh so the object shows its plain image. |
| Set point count | Resize the point list, adding points at (0, 0) or truncating. |
| Add point | Append a control point with a position and width. |
| Add point with Z elevation | Append a control point with X, Y, Z and width. |
| Insert point | Insert a control point at an index. |
| Remove point | Remove the point at an index (never below two points). |
| Clear points | Reset to two points at the origin. |

### Point Control

| Action | Description |
|---|---|
| Set point | Set position and width of one point. |
| Set point position | Set only the X and Y of one point. |
| Set point position with Z elevation | Set X, Y and Z of one point. |
| Set point Z elevation | Set the Z elevation of one point. |
| Set point width | Set the half-thickness of one point. |
| Set width of all points | Set every point's half-thickness. |

### Path Building

| Action | Description |
|---|---|
| Set line | Replace the list with a straight two-point line. |
| Set line with Z elevation | Replace the list with a straight line in 3D. |
| Set arc | Replace the list with an arc of N segments. |
| Set bezier curve | Replace the list with a sampled cubic bezier. |
| Set line between objects | Replace the list with a line between two picked objects. |
| Smooth line | Replace the list with a Catmull-Rom spline through the current points. |

### Object Following

| Action | Description |
|---|---|
| Set point to object | Move one point to the first picked instance of an object (X, Y and Z), in the current co-ordinate space. |
| Set point to image point | Move one point to an image point (or 3D Shape face image point) of an instance, with Z. |
| Set point to 3D model node | Move one point to a mesh or bone node of a 3D Model instance. |
| Set points from objects | Rebuild the list with one point per picked instance (X, Y and Z). |

### Coordinate Space

| Action | Description |
|---|---|
| Set co-ordinate space | Switch between Absolute (layout) and Relative (object) point co-ordinates. |
| Set auto-fit to line | Enable or disable fitting the object's box to the line after each rebuild (absolute space). |
| Fit object to line | Fit the object's box to the line once, now. |

### Distortion

| Action | Description |
|---|---|
| Set distortion | Set amplitude, frequency and speed together. |
| Set distortion amplitude | Set the wave's maximum pixel offset. |
| Set distortion frequency | Set the wave's spatial frequency. |
| Set distortion speed | Set how fast the wave animates. |
| Set distortion axis | Choose the offset direction. |

### Appearance

| Action | Description |
|---|---|
| Set end caps | Round, None or Square line ends. |
| Set joins | Simple, Miter, Bevel or Round corners. |
| Set cross-section points | 2 for a ribbon, 3 to 32 for a tube. |
| Set billboard camera | Automatic (3D Camera object) or a manual X, Y, Z for Billboard facing. |
| Set up vector | World up direction for Up vector facing. |
| Set facing | Flat, Billboard or Up vector orientation in 3D. |
| Set texture scroll speed | Image scroll speed along the line in pixels per second. |

### Performance

| Action | Description |
|---|---|
| Set maximum drawn points | Limit how many points are used to draw the line (0 = all). |
| Set distortion resolution | Mesh subdivisions per segment. |
| Set off-screen culling | Skip rebuilds while the line is off-screen. |

## 12. Conditions Reference

| Condition | Description |
|---|---|
| Is enabled | True while the line is generated on the object. |
| Compare point count | Compare the number of points in the line. |
| Point exists | True if an index refers to an existing point. |
| Compare co-ordinate space | True if the line uses the given co-ordinate space. |
| Is distorting | True if distort amplitude is above zero. |
| Is texture scrolling | True if Texture scroll speed is not zero. |
| Is limiting drawn points | True if the maximum drawn points setting is reducing the number of points drawn. |
| Is culled off-screen | True if off-screen culling skipped the last update. |

## 13. Expressions Reference

| Expression | Returns | Description |
|---|---|---|
| PointCount | number | Number of control points. |
| GetPointX(index) | number | Layout X of a point (after the object transform in relative space). |
| GetPointY(index) | number | Layout Y of a point. |
| GetPointZ(index) | number | Layout Z of a point (host elevation plus offset in Relative space; the point's own Z in Absolute space). |
| GetPointWidth(index) | number | Half-thickness of a point. |
| LineLength | number | Length of the rendered polyline. |
| VertexCount | number | Mesh vertices in the last rebuild (2 per column). |
| RenderedPointCount | number | Points used to draw the line after the maximum drawn points limit. |
| RenderLOD | number | Current LOD cap (0 = off). |
| DistortResolution | number | Current subdivisions per segment. |
| DistortAmplitude | number | Current distortion amplitude. |
| DistortFrequency | number | Current distortion frequency. |
| DistortSpeed | number | Current distortion speed. |
| UVScrollSpeed | number | Current scroll speed. |
| UVScrollOffset | number | Accumulated scroll distance in pixels. |
| CoordSpace | string | "absolute" or "relative". |
| EndCapStyle | string | "round", "flat" or "square". |
| JoinStyle | string | "simple", "miter", "bevel" or "round". |
| CrossSection | number | Cross-section point count (2 = ribbon). |

## 14. Triggers Reference

| Trigger | Description |
|---|---|
| On line updated | Triggered after the line's mesh has been updated (after events, before drawing). |
| On point count changed | Fires when a point is added, inserted, removed or the count is set. |

## 15. System Use Cases

### Point list

Owns the control points and their widths.

**Scenario:** Taper a trail so it fades to a tip.

```
Event: System -> On start of layout
  Action: Trail: Set point count -> 8
Event: System -> For "i" from 0 to 7
  Action: Trail: Set point -> loopindex, loopindex * 24, 0, 10 - loopindex * 1.4
```

**Scenario:** React to the count changing.

```
Event: Trail -> On point count changed
  Action: Text: Set text -> "Points: " & Trail.LineRenderer.PointCount
```

### Object following

Keeps points attached to instances.

**Scenario:** A rope between two physics objects.

```
Event: System -> Every tick
  Action: Rope: Set point to object -> 0, Ball
  Action: Rope: Set point to object -> 1, Peg
```

**Scenario:** A chain through many links.

```
Event: System -> Every tick
  Condition: System -> Pick ChainLink by evaluate ChainLink.Order >= 0
  Action: Chain: Set points from objects -> ChainLink
  // picking order defines point order; sort the picks first if needed
```

### Co-ordinate space and fit

Chooses where points live and keeps the object's box in step.

**Scenario:** Absolute rope with correct collisions.

```
Event: System -> On start of layout
  Action: Rope: Set co-ordinate space -> Absolute
  Action: Rope: Set auto-fit to line -> true
Event: Player -> Is overlapping Rope
  Action: Player: Set animation -> "Climb"
```

The host's collision polygon is deformed by the mesh, so overlap checks follow the line.

### Texture and animation

Maps the host image along the line and animates it.

**Scenario:** A flowing river.

```
Event: System -> On start of layout
  Action: River: Set texture scroll speed -> -60
  Action: River: Set distortion -> 3, 0.05, 2
```

## 16. Game Use Cases

### 1. Simplest rope

**Scenario:** A rope hangs between two pegs.

```
Event: System -> On start of layout
  Action: Rope: Set co-ordinate space -> Absolute
  Action: Rope: Set line between objects -> PegA, PegB
```

### 2. Grappling hook

**Scenario:** A line from the player to the hook point while grappling.

```
Event: Player -> Is grappling
  Action: Grapple: Set enabled -> Enabled
  Action: Grapple: Set point to object -> 0, Player
  Action: Grapple: Set point to object -> 1, Hook
Event: Player -> Is grappling (inverted)
  Action: Grapple: Set enabled -> Disabled
```

Disabling releases the mesh, so the Grapple object shows nothing odd while idle. Set its opacity to 0 in the editor and to 100 when enabled if you prefer it fully hidden.

### 3. Laser beam with impact

**Scenario:** A beam from a turret to the first hit point of a raycast.

```
Event: Turret -> Every tick
  Action: Turret: LineOfSight: Cast ray -> Turret.X, Turret.Y, Turret.X + cos(Turret.Angle) * 2000, Turret.Y + sin(Turret.Angle) * 2000
  Action: Beam: Set line -> Turret.X, Turret.Y, Turret.LineOfSight.HitX, Turret.LineOfSight.HitY
  Action: Beam: Set texture scroll speed -> 400
```

### 4. Bouncing laser

**Scenario:** A beam that reflects off mirrors.

```
Event: System -> Every tick
  Action: Beam: Clear points
  Action: Beam: Set point -> 0, Emitter.X, Emitter.Y, 4
  Action: Beam: Set point -> 1, Reflect1.X, Reflect1.Y, 4
  Action: Beam: Add point -> Reflect2.X, Reflect2.Y, 4
  Action: Beam: Add point -> Target.X, Target.Y, 4
```

### 5. Lightning strike

**Scenario:** A jagged bolt from cloud to ground that crackles for half a second.

```
Event: Cloud -> On strike
  Action: Bolt: Set line -> Cloud.X, Cloud.Y, Ground.X, Ground.Y
  Action: Bolt: Set distortion -> 14, 0.3, 40
  Action: Bolt: Set distortion axis -> Perpendicular
  Action: Bolt: Set distortion resolution -> 10
  Action: System: Wait -> 0.5
  Action: Bolt: Set enabled -> Disabled
```

### 6. Comet tail

**Scenario:** A trail of recent positions behind a comet.

```
Event: System -> Every tick
  Action: Tail: Insert point -> 0, Comet.X, Comet.Y, 10
  Condition: Tail.LineRenderer.PointCount > 20
  Action: Tail: Remove point -> 20
Event: System -> Every tick
  Action: Tail: Set width of all points -> 10
```

Widths reset each tick; for a taper, loop over the points and set width by index.

### 7. River with flow

**Scenario:** A winding river built from a bezier.

```
Event: System -> On start of layout
  Action: River: Set co-ordinate space -> Absolute
  Action: River: Set bezier curve -> 0, 300, 400, 100, 800, 500, 1200, 300, 24
  Action: River: Set width of all points -> 40
  Action: River: Set texture scroll speed -> -50
```

### 8. Conveyor belt

**Scenario:** A belt that moves boxes and scrolls its texture at the same speed.

```
Event: System -> On start of layout
  Action: Belt: Set texture scroll speed -> 120
Event: Box -> Is overlapping Belt
  Action: Box: Set X -> Box.X + 120 * dt
```

Relative space is fine here: the belt is a fixed decoration of its own object.

### 9. Node graph connectors

**Scenario:** Draggable nodes stay linked by curves.

```
Event: System -> Every tick
  Condition: Link -> Pick by UID Link.SourceUID (via family / instance variables)
  Action: Link: Set bezier curve -> From.X, From.Y, From.X + 100, From.Y, To.X - 100, To.Y, To.X, To.Y, 16
```

### 10. Skill tree lines

**Scenario:** Lines light up as skills unlock.

```
Event: Skill -> On unlocked
  Action: TreeLine: Set enabled -> Enabled
  Action: TreeLine: Set animation -> "Lit"
```

The host is a Sprite here, so its animation changes the line's look without touching the behavior.

### 11. Tether health bar

**Scenario:** A bar whose width shrinks with health.

```
Event: System -> Every tick
  Action: Bar: Set line -> 0, 0, 200 * (Player.Health / 100), 0
```

Relative space keeps the bar attached to the object even if it moves.

### 12. Fishing line with sag

**Scenario:** A line from the rod tip to the bobber with a gravity dip.

```
Event: System -> Every tick
  Action: Line: Set bezier curve -> Rod.X, Rod.Y, Rod.X, Rod.Y + 80, Bobber.X, Bobber.Y + 80, Bobber.X, Bobber.Y, 10
```

### 13. Physics chain

**Scenario:** Physics segments rendered as one rope image.

```
Event: System -> Every tick
  Action: Rope: Set points from objects -> ChainLink
  Action: Rope: Set width of all points -> 6
```

Create ChainLink instances in order so their picking order matches the chain.

### 14. Radar sweep arc

**Scenario:** An arc that spins around a radar dish.

```
Event: System -> Every tick
  Action: Sweep: Set arc -> Radar.X, Radar.Y, 160, Radar.Angle - 20, Radar.Angle, 8
  Action: Sweep: Set end caps -> Flat
```

### 15. Pulse along a wire

**Scenario:** A dashed image scrolls to show a signal travelling.

```
Event: Switch -> On pressed
  Action: Wire: Set texture scroll speed -> 300
  Action: System: Wait -> 1
  Action: Wire: Set texture scroll speed -> 0
```

### 16. Tentacle

**Scenario:** A tentacle that waves and tapers.

```
Event: System -> On start of layout
  Action: Tentacle: Set point count -> 10
  Action: Tentacle: Set distortion -> 12, 0.08, 3
  Action: Tentacle: Set distortion axis -> Perpendicular
  Action: Tentacle: Set distortion resolution -> 4
Event: System -> For "i" from 0 to 9
  Action: Tentacle: Set point -> loopindex, loopindex * 30, 0, 18 - loopindex * 1.8
```

### 17. Level-of-detail on long trails

**Scenario:** Many trails on screen at once.

```
Event: System -> On start of layout
  Condition: System -> Compare two values: TrailCount > 50
  Action: Trail: Set maximum drawn points -> 16
  Action: Trail: Set off-screen culling -> true
```

### 18. Save and load

**Scenario:** Ropes survive a savegame.

```
Event: Keyboard -> On F5 pressed
  Action: System: Save game -> "slot1"
Event: Keyboard -> On F9 pressed
  Action: System: Load game -> "slot1"
```

Points, settings and scroll state are saved with the behavior and the mesh is rebuilt after loading. No extra events are needed.

### 19. Cleanup on layout end

**Scenario:** A beam object is destroyed when its owner dies.

```
Event: Turret -> On destroyed
  Action: Beam: Destroy
```

Destroying the host releases the mesh with it. Nothing else to clean up.

### 20. 3D wire between towers

**Scenario:** A cable that climbs between two towers in a 3D layout.

```
Event: System -> On start of layout
  Action: Cable: Set co-ordinate space -> Absolute
  Action: Cable: Set line with Z elevation -> TowerA.X, TowerA.Y, 120, TowerB.X, TowerB.Y, 200
  Action: Cable: Set facing -> Billboard
```

### 21. Combined: animated magic tether with collisions

**Scenario:** A glowing tether that damages enemies touching it.

```
Event: System -> Every tick
  Action: Tether: Set point to object -> 0, Mage
  Action: Tether: Set point to object -> 1, Orb
  Action: Tether: Set auto-fit to line -> true
Event: System -> On start of layout
  Action: Tether: Set co-ordinate space -> Absolute
  Action: Tether: Set distortion -> 5, 0.2, 8
  Action: Tether: Set texture scroll speed -> 150
Event: Enemy -> Is overlapping Tether
  Action: Enemy: Subtract from Health -> 10 * dt
```

Auto-fit keeps the Tether's collision polygon aligned with the visible line.

### Other game use cases

**Platformers** use it for grappling hooks, zip lines and swinging ropes that follow physics anchors.
**Shoot 'em ups** render lasers, homing beams and boss tentacles with scrolling energy textures.
**Puzzle games** connect nodes, pipes and circuit wires, lighting them up as puzzles complete.
**Tower defense** draws targeting beams and chain-lightning arcs between enemies.
**RPGs** show spell tethers, leashes and skill-tree links.
**Strategy games** draw supply routes, borders and unit paths from waypoint lists.
**Racing games** render track edges, drift trails and boost streaks.
**Fishing and farming games** render fishing lines, hoses and vines.
**Rhythm games** draw note highways and connecting slides between holds.
**Physics sandboxes** render ropes, springs and chains over physics joints.
**Card and board games** animate links between related cards or path highlights on boards.
**Metroidvanias** use it for grapples, tethers and energy conduits that open with upgrades.
**Space games** render tractor beams, docking cables and orbit paths.
**Horror games** animate tentacles, cables and flickering wires with distortion.
**Educational apps** draw graph edges, connectors and flow arrows.
**Idle games** show resource flows along pipes with scrolling textures.
**Sports games** draw trajectory previews, pass lines and swing paths.
**Party games** render jump ropes, tug-of-war ropes and confetti streamers.
**Stealth games** draw laser tripwires and camera sight lines.
**Roguelikes** render lightning, whips and chain attacks that reach across rooms.

## 17. C3 Debugger

The debugger shows one section, **Line Renderer**, under the host object.

| Field | Meaning |
|---|---|
| enabled | Whether the line is generated. |
| coordSpace | absolute or relative. |
| pointCount | Control points in the list. |
| renderedPointCount | Points drawn after the maximum drawn points limit. |
| meshColumns | Columns of the mesh currently created on the host. |
| vertexCount | Mesh vertices in the last rebuild. |
| lineLength | Length of the rendered polyline. |
| textureMapping | Mapping used in the last rebuild (tile or stretch). |
| endCapStyle | Current cap style. |
| joinStyle | Joins in use (tubes show simple). |
| crossSection | Ribbon or tube point count. |
| meshRows | Rows of the mesh created on the host. |
| ribbonFacing | Current facing mode. |
| cameraSource | Where the billboard camera comes from: manual, the 3D Camera object, or none. |
| uvScrollOffset | Accumulated scroll distance. |
| distortAmplitude | Current amplitude. |
| distortResolution | Subdivisions per segment. |
| renderLOD | LOD cap, or off. |
| autoFit | Whether auto-fit is enabled. |
| isCulled | Whether the last update was skipped by off-screen culling. |
| meshRebuildCount | Rebuilds since creation. |
| lastTickRebuilt | Whether the last tick rebuilt the mesh. |

Open the debugger with the **Debug layout** button in the editor toolbar, select the host instance and expand the behavior section.

## 18. Scripting (C3 Script / JavaScript)

### Accessing the behavior

```js
const rope = runtime.objects.Rope.getFirstInstance();
const line = rope.behaviors.LineRenderer; // the name you gave the behavior in the editor
```

### Calling actions from script

Every action is exposed on the behavior instance as a PascalCase method named after the action. The methods are the same functions the event sheet calls, so they have the same side-effects. Combo parameters are passed as 0-based indices.

```js
line.SetCoordSpace(0);                 // 0 = absolute, 1 = relative
line.SetLine(100, 100, 400, 160);
line.SetPointWidth(1, 4);
line.AddPoint(500, 200, 8);
line.SetDistortion(6, 0.2, 10);
// texture mapping is derived from the host: Tiled Background tiles, Sprite stretches
line.SetEndCapStyle(2);                // 0 = round, 1 = none, 2 = square
line.SetJoinStyle(1);                  // 0 = simple, 1 = miter, 2 = bevel, 3 = round
line.SetCrossSection(8);               // tube with 8 points around it
line.SetBillboardCamera(1, 0, 0, 800); // 0 = automatic, 1 = manual x, y, z
line.SetPointToImagePoint(0, hook, 0, "tip");   // face 0 = none
line.SetPointToNode(1, model, 1, "hand_r");      // node type 0 = mesh, 1 = bone
line.SetEnabled(1);                    // 0 = disabled, 1 = enabled
line.FitObjectToLine();
```

### Reading state from script

```js
line.MeshPointCount;          // number of points
line.MeshGetPointX(i);        // layout X of point i
line.MeshGetPointY(i);
line.MeshGetPointZ(i);
line.MeshGetPointWidth(i);
line.MeshLineLength;
line.MeshVertexCount;
line.MeshRenderedPointCount;
line.MeshCoordSpace;          // "absolute" | "relative"
line.MeshTextureMapping;      // "tile" (Tiled Background) | "stretch" (Sprite), derived from the host
line.MeshEndCapStyle;         // "round" | "flat" | "square"
line.MeshJoinStyle;           // "simple" | "miter" | "bevel" | "round"
line.MeshEnabled;
```

### Listening to events from script

```js
line.on("OnMeshRebuilt", () => console.log("rebuilt", line.MeshVertexCount));
line.on("OnPointCountChanged", () => console.log("points", line.MeshPointCount));
```

### Looping over points

```js
for (let i = 0; i < line.MeshPointCount; i++) {
  console.log(i, line.MeshGetPointX(i), line.MeshGetPointY(i));
}
```

### Complete example

```js
runtime.addEventListener("tick", () => {
  const rope = runtime.objects.Rope.getFirstInstance();
  const line = rope.behaviors.LineRenderer;
  const a = runtime.objects.PegA.getFirstInstance();
  const b = runtime.objects.PegB.getFirstInstance();
  if (line.MeshPointCount !== 2) line.SetLine(a.x, a.y, b.x, b.y);
  line.SetPointXY(0, a.x, a.y);
  line.SetPointXY(1, b.x, b.y);
});
```

## 19. Feature Deep-Dive: How the Mesh Works

Construct lets any Sprite or Tiled Background be drawn through a **mesh**, a grid of points in normalised object co-ordinates where (0, 0) is the top-left of the unrotated box and (1, 1) the bottom-right. Points may lie outside that range.

Each rebuild the behavior:

1. Applies the maximum drawn points limit and the co-ordinate space transform to the control points.
2. Subdivides segments by the distort resolution and computes the arc length and tangent at each sample.
3. Builds one **column** per sample: a left and a right vertex at plus and minus the width along the ribbon's width axis, plus the distortion offset. Corners emit extra columns for the Bevel and Round join styles, and round caps add four narrowing columns at each end.
4. Converts every vertex from layout space back into the host's normalised box (inverse of position, angle and size) and writes it with `setMeshPoint`, with a Z offset relative to the host and texture co-ordinates derived from arc length.

Because the mesh grid is columns x 2, the whole line is one strip and a change in column count is the only time the mesh is recreated. Texture co-ordinates for a Tiled Background are scaled by the image size divided by the object size, so one unit equals one image repeat regardless of how the host was sized in the editor.

## 20. Tips and Common Mistakes

- **The editor shows the plain object.** Behaviors cannot draw in the Layout View, so the line only appears in preview. Size and place the host to roughly cover the line in the editor for easier selection.
- **Widths are half-thickness.** Width 16 gives a 32 pixel wide line.
- **Sprites cannot tile or scroll.** Their frame is a spritesheet region, so the image is stretched once along the line. Use a Tiled Background for repeating or scrolling textures.
- **Absolute lines outside the box may be culled.** Enable auto-fit (or size the host to cover the line) so Construct's bounding box matches the visible line.
- **Relative space scales with the object.** Resizing the host stretches the line by the ratio to its creation size. Use absolute space for lines that must stay in layout pixels.
- **Only one Line Renderer per object.** The behavior owns the host mesh.
- **Other mesh actions will be overwritten.** The host's own Set mesh point actions are replaced on the next rebuild.
- **Point colors are gone.** Tint the whole line with the host's color and opacity, or use a gradient image.
- **Distortion looks faceted?** Raise distort resolution, which adds mesh columns between control points.
- **Billboard needs a camera position.** The behavior finds the 3D Camera object automatically; if your project has none, use Set billboard camera in Manual mode, otherwise Billboard behaves like Flat.
- **Tubes use Simple joins.** A ring needs a centre, so Miter, Bevel and Round only apply to 2-point ribbons.
- **Relative space with a 3D-rotated host.** The line rotates with the host as expected, but object-following actions only undo the host's 2D angle when converting layout positions into local space. Use Absolute space for lines that attach to other objects.
