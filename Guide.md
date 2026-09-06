# Line Renderer Guide

Line Renderer is a Construct 3 **behavior** for **Sprite** and **Tiled Background** objects. Add it to an object and that object becomes a procedural line: a rope, a beam, a trail, a river, a cable or a UI connector, built from a list of **control points** you edit from events. The behavior does not draw anything itself. It rewrites the host object's **mesh** every time the line changes, so Construct keeps drawing the host with its own image, animation frames, opacity, color, blend mode, effects, Z order and collision polygon. You get one object per line, no chains of rotated sprite segments, and full event-sheet control over shape, thickness, texture and wave.

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
9. [Wave, Caps and 3D Facing](#9-wave-caps-and-3d-facing)
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
- **Lasers and energy beams**: A Tiled Background with a glow image, a scrolling texture and a little wave makes an animated beam with no seams.
- **Rivers, roads and conveyor belts**: Tile a texture along a curved path at a fixed pixel density and scroll it to show flow.
- **Node-graph and UI connectors**: Draw clean bezier links between draggable panels using the same object type for every link.
- **Lightning and magic arcs**: Smooth a jagged path and animate the wave for a living, crackling effect.
- **3D wires and tapes**: Points carry a Z offset and the ribbon can face the camera or twist as a flat tape in 3D layouts.
- **Anything a Sprite can do, on a line**: Because the host is a normal object, animations, effects, families, containers and collisions all keep working.

## 2. Core Concepts

### The problem this addon solves

Without a mesh line system you place many rotated sprites to fake a curve. That costs objects, shows seams at joins, and every visual tweak means touching every segment. Line Renderer keeps **one object per line** and rebuilds the host's mesh from a **control point** list, so the whole stroke is a single textured strip.

### Key design decisions

- **The host draws, the behavior shapes.** The behavior only writes mesh points. Image, color, opacity, blend mode, effects and Z order stay on the host object where Construct expects them.
- **Points live in your events.** The behavior does not simulate rope physics. You decide where points go; it renders them.
- **Absolute space with auto-fit by default.** Points are layout co-ordinates and the object is sized as the unrolled rope (texture length by thickness), so a Tiled Background tiles at its own image scale and scrolls with its own image offset. Switch to Relative space for a line that is a fixed decoration of its object.
- **One behavior per object.** The behavior owns the mesh, so Construct allows only one Line Renderer per object.
- **Safe indices.** Out-of-range point indices are ignored, never crash events.

### Key concepts at a glance

| Concept | Meaning |
|---|---|
| **Control point** | A point with x, y, z, a height (line thickness there) and a width (texture width of the segment that starts at it). |
| **Host object** | The Sprite or Tiled Background the behavior is attached to. It provides the image and everything visual. |
| **Mesh column** | One sample along the line, with a left and right vertex. The host mesh is columns x 2. |
| **Co-ordinate space** | Relative (object-local pixels that follow the object) or Absolute (layout co-ordinates). |
| **Wave** | A ripple along the line described like the Sine behavior: magnitude, wavelength, period, movement and shape. |

## 3. Project Setup

1. Install the addon (`salmanshh_line_renderer-2.1.0.0.c3addon`) through the Addon Manager and restart Construct.
2. Add a **Tiled Background** to your layout. Paint or import the image you want along the line (a rope, a glow strip, a dashed pattern). For most lines a wide, short image works best: the image height maps across the ribbon, the image width repeats along it.
3. Add the **Line Renderer** behavior to the object. The default properties render the object exactly across its own box, so nothing looks different until you edit points.
4. Optionally use a **Sprite** instead. Sprites work the same way, except the image is always stretched once along the line (spritesheets cannot tile).
5. Drive the points from events:

```
Event: System -> On start of layout
  Action: Rope: Pin points to objects -> Ball, Pinned
  // one point per Ball instance (in IID order); each point follows its Ball
  // every tick from now on, no per-tick event needed
```

"Pin points to objects" uses whichever instances are picked when the action runs. On start of layout that is every instance, in IID order, so create your chain links in order. To attach just the two ends of a line instead, use **Pin point to object** for each end. The per-point form also works in a loop (image point 0 is the origin, face None, mode Pinned), because addressing a point past the end grows the list:

```
Event: System -> On start of layout
  Condition: System -> For each Ball
  Action: Rope: Pin point to object -> Ball.IID, Ball, 0, None, Pinned
```

## 4. Behavior Properties

| Property | Type | Default | Description |
|---|---|---|---|
| Initial point count | integer | 2 | Points created at start, spread across the object's box so it looks unchanged. |
| End caps | combo | Round | None (cut at the endpoint), Square or Round ends; Square and Round extend by half the thickness. |
| Joins | combo | Round | Simple, Miter, Bevel or Round corners between segments. |
| Cross-section points | integer | 2 | 2 draws a flat ribbon; 3 to 32 wraps the image around a 3D tube. |
| Facing | combo | Flat | Flat (2D), Billboard (face the 3D camera) or Up vector (3D tape). |
| Auto-fit to line | check | true | Absolute space only: size the object to the unrolled line (texture length by thickness) at the line's centre after every update, so the host's own image scale and image offset work along the rope. |
| Enabled | check | true | Whether the behavior is initially enabled. When disabled the object is drawn normally. |

The properties are read once when the instance is created. Everything they set can also be changed at runtime with the matching action.

Co-ordinate space and the wave are not properties either: the line uses absolute (layout) co-ordinates unless you call Set co-ordinate space, and the wave is off until you call Set wave, so a new user sees only what is needed to get a rope on screen. Several other things are deliberately not properties because the host object already defines them: the **image** and its animation, the **texture tiling and scrolling** (a Tiled Background's own image scale and image offset), the **line thickness** used by path-building actions (the object's height at creation), and opacity, color, blend mode and effects.

## 5. Managing Points

A line is a list of at least two **control points**. Each point has an X and Y position, an optional Z elevation, a **height** (the line thickness at that point, like the object's height) and a **width** (how much of the image the segment starting at it covers; automatic unless you fix it). Heights blend between points, so a line from height 32 to height 0 tapers to a tip.

```
Event: System -> On start of layout
  Action: Trail: Set point count -> 5
  Action: Trail: Set point position -> 0, 0, 0, 0
  Action: Trail: Set point size -> 0, -1, 24
  Action: Trail: Set point position -> 1, 40, -10, 0
  Action: Trail: Set point size -> 1, -1, 20
  Action: Trail: Set point position -> 2, 80, 0, 0
  Action: Trail: Set point size -> 2, -1, 16
  Action: Trail: Set point position -> 3, 120, 10, 0
  Action: Trail: Set point size -> 3, -1, 8
  Action: Trail: Set point position -> 4, 160, 0, 0
  Action: Trail: Set point size -> 4, -1, 0
  // heights taper from 24 to 0 for a comet tail
```

Add, insert and remove points change the count and fire **On point count changed**, and so does setting or pinning a point at an index past the end, which grows the list to include it. Remove point refuses to go below two points. Set point count grows the list with points at (0, 0) or truncates it.

Gotchas:

- Height is the thickness. A rope that should look 20 pixels thick uses height 20.
- Two consecutive points at the same position produce a zero-length segment. The behavior tolerates it, but the tangent there is guessed from neighbours, so avoid it for clean caps.

## 6. Path Building and Object Linking

The path-building actions replace the whole point list in one go, using half the object's height (its height at creation) as the width of every point.

| Action | What it builds |
|---|---|
| Set line | Two points, a straight segment. |
| Set line with Z elevation | Two points with Z offsets. |
| Set arc | Points along a circle segment between two angles. |
| Set bezier curve | Points sampled along a cubic bezier. |
| Pin points to objects | One point per picked instance, in picking order, following them (Pinned) or set once (Once). |
| Smooth line | Replaces the list with a Catmull-Rom spline through the existing points. |

```
Event: Mouse -> On left button clicked
  Action: Link: Set bezier curve -> NodeA.X, NodeA.Y, NodeA.X + 120, NodeA.Y, NodeB.X - 120, NodeB.Y, NodeB.X, NodeB.Y, 12
  // an S-curve connector with 12 segments
```

**Pin point to object** attaches one point to an instance (or one of its image points) and keeps following it, which is the tool for moving anchors; choose Once to only move the point now. **Pin points to objects** rebuilds the list from a picked set, which is ideal for chains of physics segments: pick the chain links in order and the line passes through all of them.

## 7. Coordinate Space and Auto-Fit

**Relative** space treats point co-ordinates as pixels from the object's origin, before rotation and scale. Move, rotate or resize the object and the line follows, exactly like the image on a plain Tiled Background. Resizing scales the line by the ratio to the object's size at creation. This mode is the right one when the line is a fixed decoration of the object.

**Absolute** space (the default) treats point co-ordinates as layout co-ordinates. The object's position, angle and size no longer move the line. This mode is the right one for ropes and connectors that attach to other objects.

In absolute space the line can extend outside the host's box; Construct still draws mesh points outside it. **Auto-fit to line** (on by default) sizes the object to the unrolled rope, texture length by thickness at the line's centre, which is what makes the host's own texture settings apply along the rope.

```
Event: System -> On start of layout
  Action: Rope: Set co-ordinate space -> Relative
  Action: Rope: Set auto-fit to line -> Disabled
  // a decoration that moves with the object instead of a pinned rope
```

Auto-fit is ignored in relative space, because in that mode the object's box is what defines the line.

## 8. Texture Mapping and Scrolling

The behavior never touches the host's image settings. Whatever the Sprite or Tiled Background draws across its own box is what appears along the line, because Construct maps mesh texture co-ordinates onto exactly that box. The behavior's job is to make the box the **unrolled rope**: with Auto-fit on, the object is sized to the line's texture length by its thickness and placed at the line's centre, and the texture co-ordinate runs from 0 at the start of the line to 1 at the end.

**Tiled Background hosts** therefore tile at exactly the density their own **Image scale** property says, one repeat per scaled image width along the rope however long or curved it gets. Scroll the rope with the Tiled Background's own **Set image offset** action (one pixel of offset moves the texture one pixel along the rope), and image angle, tile randomisation and blend margins all keep working.

**Sprite hosts** stretch the current animation frame once along the whole line, because a frame is one region of a spritesheet. Animations play as normal.

```
Event: System -> Every tick
  Action: Beam: Set image offset -> Beam.ImageOffsetX + 200 * dt, 0
  // Tiled Background action: the texture flows along the line at 200 px/s
```

### Point width and height

Each point has a **height**, the line thickness there (like the object's height), and a **width**, how much of the image the segment starting at it covers. With Auto-fit on, the object's height is also a live control: change it in the editor or with the object's own Set size action and every point's height scales to match, so a taller object is a thicker rope.

By default a segment's width is automatic: it equals the segment's length, so the texture keeps a **constant texel density** and more repeats appear as the segment grows. **Set point size** with a width fixes it instead: the segment always shows that many pixels of image, so the image stretches and squashes with the segment. To freeze a segment at its current length, pass its own `PointWidth(index)` as the width. Width 0 returns to automatic, and -1 leaves a value unchanged. Automatic and fixed segments mix freely along one rope, and the object's width becomes the combined texture length, which **TextureLength** returns.

```
Event: System -> On start of layout
  Action: Bungee: Pin points to objects -> Anchor, Pinned
  Action: Bungee: Set point size -> 2, Self.LineRenderer.PointWidth(2), -1
  // the segment between anchors 2 and 3 is elastic: its pattern stretches
  // while the rest of the rope keeps tiling at constant density
```

With Auto-fit off (or in Relative space) the object keeps the box you gave it, so the box's own repeat count is spread over the whole line and the texture stretches with the rope's length.

## 9. Wave, Caps and 3D Facing

The **wave** ripples the line, using the same vocabulary as the Sine behavior. **Magnitude** is how far points are pushed, in pixels (0 turns the wave off). **Wavelength** is the length of one full wave along the line, in pixels. **Period** is how many seconds one cycle takes: the wave travels one wavelength per period, 0 keeps it still and a negative period reverses it. **Movement** chooses the direction points are pushed: horizontal, vertical, both, across the line, or Z elevation. **Wave shape** is sine, triangle, sawtooth, reverse sawtooth or square. **Wave resolution** adds mesh steps between points; a 400 pixel segment with a 100 pixel wavelength needs several steps to look smooth.

```
Event: System -> On start of layout
  Action: Lightning: Set wave -> 6, 40, 0.1, Across the line, Triangle
  Action: Lightning: Set performance -> 0, 6, Disabled
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
  Action: Rope: Set line style -> Round, Round, 2
```

### Working in 3D

The behavior follows the same approach as the Trail Renderer: every vertex carries a real Z, the host object is treated as a canvas, and Construct draws the result with the host's Z elevation and 3D camera. Nothing changes for 2D projects; all Z values default to 0.

**Point Z.** In Relative space a point's Z is an offset from the host's Z elevation, so the line rises and falls with the object. In Absolute space a point's Z is layout Z, exactly like its X and Y. Use **Set point position**, **Add point** or **Set line**, which all take a Z elevation, or let the object-following actions read Z from other instances: **Pin point to object** and **Pin points to objects** take the target's total Z elevation and convert it into the current co-ordinate space.

**Attach points.** **Pin point to object** reads a named image point (with its Z on r496 and later), or a face image point of a 3D Shape when you pick a face. **Set point to 3D model node** reads the world position of a mesh or bone node of a 3D Model object. Both feature-detect the runtime API and fall back to the instance position on older runtimes.

**Facing** controls how the width is oriented. Flat keeps the ribbon in the layout plane, which is right for lines on the ground. Billboard turns the width toward the camera. Up vector makes a tape perpendicular to the world up axis that twists as the line climbs. **Set facing** also takes X, Y, Z: for Billboard they are the camera position (all 0 uses the project's 3D Camera object automatically), for Up vector they are the up direction.

**Tubes.** **Cross-section points** (a property, or the third parameter of Set line style) turns the flat ribbon into a tube. With 2 points the line is a ribbon; with 3 or more, the image is wrapped around a tube with that many points around it (the mesh gets one extra row for the seam). Tubes look right from any camera angle, so they do not need billboard facing. Round caps become rounded ends, the wave moves the whole ring, and joins fall back to Simple because a ring needs a centre. Six to twelve points make a convincing cable.

```
Event: System -> On start of layout
  Action: Cable: Set line style -> Round, Round, 8
  // 8 cross-section points: a tube
  Action: Cable: Set line -> PoleA.X, PoleA.Y, 200, PoleB.X, PoleB.Y, 260
```

**Auto-fit in 3D.** With auto-fit on (Absolute space), the host is sized as the unrolled rope at the line's centre, its own Z elevation is lowered to the lowest vertex so Z sorting matches the line and all mesh offsets stay positive, and any 3D rotation on the host is cleared so mesh points are written in layout space. This mirrors the Trail Renderer's host handling. In Relative space the host keeps its rotation and the line rotates with it.

## 10. Performance Controls

- **Maximum drawn points** (Set performance) caps how many points feed the mesh. With 200 points and a cap of 40, the mesh uses 40 evenly spread points. The behavior additionally caps the mesh at 2048 vertices.
- **Wave resolution** adds columns per segment. Keep it at 1 unless the wave needs it.
- **Off-screen culling** (Set performance) skips rebuilding while the line's bounds are outside the layer viewport. The last mesh stays on the host.
- The mesh is only rebuilt when something changed: points, settings, the host transform (absolute space) or size (relative space), and every tick while a wave is moving.

## 11. Actions Reference

### Points

| Action | Description |
|---|---|
| Set enabled | Turn line generation on or off. Off releases the mesh so the object shows its plain image. |
| Set point count | Resize the point list, adding points at the end or removing from the end. |
| Add point | Append a point with X, Y, Z elevation and height. |
| Insert point | Insert a point at an index with X, Y, Z elevation and height. |
| Remove point | Remove the point at an index (never below two points). |
| Set point position | Set X, Y and Z elevation of a point. Setting a point past the end adds points up to it. |
| Set point size | Set a point's width (texture width of the next segment: 0 automatic, a value fixes it so the image stretches) and height (line thickness); -1 keeps a value. |
| Set size of all points | The same for every point. |

### Lines & paths

| Action | Description |
|---|---|
| Set line | Replace the points with a straight line between two positions (with Z elevations). |
| Set arc | Replace the points with an arc of N segments. |
| Set bezier curve | Replace the points with a sampled cubic bezier. |
| Smooth line | Replace the points with a smooth curve through the current points. |

### Objects

| Action | Description |
|---|---|
| Pin point to object | Move a point to an instance's image point (or 3D shape face image point) and keep following it every tick, or just once. |
| Pin points to objects | Replace the points with one per picked instance and keep following them, or just once. |
| Set point to 3D model node | Move a point to a mesh or bone node of a 3D Model instance. |
| Unpin point | Stop a point following its instance; -1 unpins all points. |

### Co-ordinates

| Action | Description |
|---|---|
| Set co-ordinate space | Absolute (layout) or Relative (object) point co-ordinates. |
| Set auto-fit to line | Enable or disable sizing the object as the unrolled line after each update (absolute space). |

### Wave

| Action | Description |
|---|---|
| Set wave | Magnitude (pixels), wavelength (pixels per cycle), period (seconds per cycle, 0 still, negative reversed), movement and wave shape. |
| Set wave magnitude | How far points are pushed, in pixels; 0 turns the wave off. Animate it to fade the wave in or out. |

### Appearance

| Action | Description |
|---|---|
| Set line style | End caps (Round, None, Square), joins (Simple, Miter, Bevel, Round) and cross-section points (2 ribbon, 3 to 32 tube). |
| Set facing | Flat, Billboard (X, Y, Z camera position, all 0 for the 3D Camera object) or Up vector (X, Y, Z up direction). |

### Performance

| Action | Description |
|---|---|
| Set performance | Maximum drawn points (0 = all), wave resolution (mesh steps per segment) and off-screen culling. |

## 12. Conditions Reference

| Condition | Description |
|---|---|
| Is enabled | True while the line is generated on the object. |
| Compare point count | Compare the number of points in the line. |
| Compare co-ordinate space | True if the line uses the given co-ordinate space. |
| Is wave active | True if the wave magnitude is above zero. |
| Is point pinned | True if the point is following a pinned instance. |

## 13. Expressions Reference

| Expression | Returns | Description |
|---|---|---|
| PointCount | number | Number of points. |
| PointX(index) | number | Layout X of a point. |
| PointY(index) | number | Layout Y of a point. |
| PointZ(index) | number | Layout Z elevation of a point. |
| PointHeight(index) | number | Line thickness at a point, in pixels. |
| PointWidth(index) | number | Texture width of the segment starting at a point: its fixed width, or its current length. |
| LineLength | number | Length of the line, in pixels. |
| TextureLength | number | Texture length of the line (the object's width after Auto-fit). |
| WaveMagnitude | number | How far the wave pushes points, in pixels. |
| Wavelength | number | Length of one full wave, in pixels. |
| WavePeriod | number | Seconds per wave cycle (0 = still). |

## 14. Triggers Reference

| Trigger | Description |
|---|---|
| On line updated | Triggered after the line's mesh has been updated (after events, before drawing). |
| On point count changed | Triggered when a point is added or removed. |

## 15. System Use Cases

Each block isolates one system and uses every action, condition and expression that belongs to it. `Rope` is a Tiled Background with the behavior named `LineRenderer`.

### Points (Set enabled, Set point count, Add point, Insert point, Remove point, Set point position, Set point size, Set size of all points)

**Scenario:** Build a tapered comet tail by hand, then react to its point count.

```
Event: System -> On start of layout
  Action: Rope: Set point count -> 6
  Action: Rope: Set size of all points -> -1, 24
  // width -1 keeps automatic texture width; height 24 is the thickness
Event: System -> For "i" from 0 to 5
  Action: Rope: Set point position -> loopindex, 100 + loopindex * 40, 300, 0
  Action: Rope: Set point size -> loopindex, -1, 24 - loopindex * 4
  // heights blend between points, so the tail thins to 4 px
Event: Keyboard -> On Space pressed
  Action: Rope: Add point -> Rope.LineRenderer.PointX(5) + 40, 300, 0, 4
  Action: Rope: Insert point -> 0, 60, 300, 0, 24
  Action: Rope: Remove point -> 3
Event: Rope -> On point count changed
  Action: Text: Set text -> "Points: " & Rope.LineRenderer.PointCount
Event: Keyboard -> On H pressed
  Action: Rope: Set enabled -> Disabled
  // the Tiled Background is drawn as a plain box again until re-enabled
```

Setting a point at an index past the end adds points up to it, so `Set point position -> 9, ...` on a 6 point line makes it 10 points.

### Lines & paths (Set line, Set arc, Set bezier curve, Smooth line)

**Scenario:** Switch between ready-made shapes, then smooth the result.

```
Event: Keyboard -> On 1 pressed
  Action: Rope: Set line -> 100, 200, 0, 500, 200, 0
Event: Keyboard -> On 2 pressed
  Action: Rope: Set arc -> 300, 300, 120, 180, 360, 12
  // a half circle from 180 to 360 degrees in 12 segments
Event: Keyboard -> On 3 pressed
  Action: Rope: Set bezier curve -> 100, 300, 250, 100, 350, 500, 500, 300, 16
Event: Keyboard -> On 4 pressed
  Action: Rope: Smooth line -> 3
  // inserts 3 points per segment along a curve through the current points
Event: System -> Every tick
  Action: Text: Set text -> round(Rope.LineRenderer.LineLength) & " px"
```

Shape actions use half the object's height as the line thickness for the new points.

### Objects (Pin point to object, Pin points to objects, Set point to 3D model node, Unpin point, Is point pinned)

**Scenario:** A rope hung between two pegs that can be cut loose.

```
Event: System -> On start of layout
  Action: Rope: Pin point to object -> 0, PegA, 0, None, Pinned
  Action: Rope: Pin point to object -> 1, PegB, "hook", None, Pinned
  // point 1 follows PegB's image point named "hook"
Event: Mouse -> On Left button clicked on Rope
  Action: Rope: Unpin point -> 1
  // point 1 stays where it is; -1 would unpin every point
Event: Rope -> Is point pinned -> 0
  Action: Text: Set text -> "Start pinned"
```

**Scenario:** A physics chain rendered as one rope.

```
Event: System -> On start of layout
  Action: Rope: Pin points to objects -> ChainLink, Pinned
  // one point per ChainLink in IID order; create the links in order
Event: Keyboard -> On C pressed
  Action: Rope: Pin points to objects -> ChainLink, Once
  // same positions, but the points no longer follow
```

**Scenario:** Attach the end of a whip to a 3D model's hand bone.

```
Event: System -> Every tick
  Action: Rope: Set point to 3D model node -> 5, Hero, Bone, "hand_r"
```

### Co-ordinates (Set co-ordinate space, Set auto-fit to line, Compare co-ordinate space)

**Scenario:** A decorative line that must move with its object.

```
Event: System -> On start of layout
  Action: Rope: Set co-ordinate space -> Relative
  Action: Rope: Set auto-fit to line -> Disabled
  Action: Rope: Set line -> -80, 0, 0, 80, 0, 0
  // object-local pixels around the origin; move or rotate Rope and the line follows
Event: Rope -> Compare co-ordinate space -> Relative
  Action: Text: Set text -> "Relative: " & Rope.LineRenderer.TextureLength & " px of texture"
```

Absolute space with auto-fit is the default and the right choice for pinned ropes: the object is resized to the unrolled line so the Tiled Background's own image scale and image offset work along it.

### Texture (Set point size width, PointWidth, PointHeight, TextureLength)

**Scenario:** An elastic section in the middle of a chain.

```
Event: System -> On start of layout
  Action: Rope: Pin points to objects -> Anchor, Pinned
  Action: Rope: Set point size -> 2, Rope.LineRenderer.PointWidth(2), -1
  // freezes segment 2 at its current texture width: its pattern stretches as the anchors move
Event: Keyboard -> On R pressed
  Action: Rope: Set point size -> 2, 0, -1
  // back to automatic: constant texel density again
Event: System -> Every tick
  Action: Text: Set text -> "Thickness " & Rope.LineRenderer.PointHeight(2) & ", texture " & Rope.LineRenderer.TextureLength
```

Scroll or rescale the texture with the Tiled Background's own actions:

```
Event: System -> Every tick
  Action: Rope: Set image offset -> Rope.ImageOffsetX + 120 * dt, 0
```

### Wave (Set wave, Set wave magnitude, Is wave active, WaveMagnitude, Wavelength, WavePeriod)

**Scenario:** A beam that ripples while firing and settles afterwards.

```
Event: Turret -> On fire
  Action: Rope: Set wave -> 8, 60, 0.3, Across the line, Sine
  // 8 px either side, one wave every 60 px, one cycle every 0.3 s
Event: Rope -> Is wave active
  Action: Rope: Set wave magnitude -> max(0, Rope.LineRenderer.WaveMagnitude - 10 * dt)
  // fades the ripple out; the wave switches off at 0
Event: Keyboard -> On Z pressed
  Action: Rope: Set wave -> 6, Rope.LineRenderer.Wavelength, -Rope.LineRenderer.WavePeriod, Z elevation, Triangle
  // same wavelength, reversed direction, bobbing in Z elevation with a triangle shape
```

### Appearance (Set line style, Set facing)

**Scenario:** A 3D cable with round ends drawn as a tube.

```
Event: System -> On start of layout
  Action: Rope: Set line style -> Round, Round, 8
  // round caps, round joins, 8 points around the cross-section
  Action: Rope: Set line -> TowerA.X, TowerA.Y, 120, TowerB.X, TowerB.Y, 200
Event: Keyboard -> On F pressed
  Action: Rope: Set facing -> Billboard, 0, 0, 0
  // all zeros: face the project's 3D Camera object automatically
Event: Keyboard -> On U pressed
  Action: Rope: Set facing -> Up vector, 0, 0, 1
```

### Performance (Set performance)

**Scenario:** Many long trails on screen at once.

```
Event: System -> On start of layout
  Condition: System -> Compare two values: TrailCount > 50
  Action: Rope: Set performance -> 16, 1, Enabled
  // at most 16 points drawn per line, no extra wave steps, skip updates off-screen
Event: Rope -> Compare point count -> Greater than, 64
  Action: Rope: Set performance -> 32, 1, Enabled
```

### Triggers (On line updated, On point count changed)

```
Event: Rope -> On line updated
  Action: Debug: Set text -> "Texture length " & Rope.LineRenderer.TextureLength
Event: Rope -> On point count changed
  Condition: Rope -> Compare point count -> Less than, 2
  Action: Rope: Set point count -> 2
```

## 16. Game Use Cases

### 1. Simplest rope

**Scenario:** A rope hangs between two pegs.

```
Event: System -> On start of layout
  Action: Rope: Pin point to object -> 0, PegA, 0, None, Pinned
  Action: Rope: Pin point to object -> 1, PegB, 0, None, Pinned
```

### 2. Grappling hook

**Scenario:** A line from the player to the hook point while grappling.

```
Event: Player -> Is grappling
  Action: Grapple: Set enabled -> Enabled
  Action: Grapple: Pin point to object -> 0, Player, 0, None, Pinned
  Action: Grapple: Pin point to object -> 1, Hook, 0, None, Pinned
Event: Player -> Is grappling (inverted)
  Action: Grapple: Set enabled -> Disabled
```

Disabling releases the mesh, so the Grapple object shows nothing odd while idle. Set its opacity to 0 in the editor and to 100 when enabled if you prefer it fully hidden.

### 3. Laser beam with impact

**Scenario:** A beam from a turret to the first hit point of a raycast.

```
Event: Turret -> Every tick
  Action: Turret: LineOfSight: Cast ray -> Turret.X, Turret.Y, Turret.X + cos(Turret.Angle) * 2000, Turret.Y + sin(Turret.Angle) * 2000
  Action: Beam: Set line -> Turret.X, Turret.Y, 0, Turret.LineOfSight.HitX, Turret.LineOfSight.HitY, 0
  Action: Beam: Set image offset -> Beam.ImageOffsetX + 400 * dt, 0
  // Tiled Background action: scrolls the texture along the line
```

### 4. Bouncing laser

**Scenario:** A beam that reflects off mirrors.

```
Event: System -> Every tick
  Action: Beam: Set point count -> 2
  Action: Beam: Set point position -> 0, Emitter.X, Emitter.Y, 0
  Action: Beam: Set point size -> 0, -1, 8
  Action: Beam: Set point position -> 1, Reflect1.X, Reflect1.Y, 0
  Action: Beam: Set point size -> 1, -1, 8
  Action: Beam: Add point -> Reflect2.X, Reflect2.Y, 0, 8
  Action: Beam: Add point -> Target.X, Target.Y, 0, 8
```

### 5. Lightning strike

**Scenario:** A jagged bolt from cloud to ground that crackles for half a second.

```
Event: Cloud -> On strike
  Action: Bolt: Set line -> Cloud.X, Cloud.Y, 0, Ground.X, Ground.Y, 0
  Action: Bolt: Set wave -> 14, 40, 0.05, Across the line, Triangle
  Action: Bolt: Set performance -> 0, 10, Disabled
  Action: System: Wait -> 0.5
  Action: Bolt: Set enabled -> Disabled
```

### 6. Comet tail

**Scenario:** A trail of recent positions behind a comet.

```
Event: System -> Every tick
  Action: Tail: Insert point -> 0, Comet.X, Comet.Y, 0, 20
  Condition: Tail.LineRenderer.PointCount > 20
  Action: Tail: Remove point -> 20
Event: System -> Every tick
  Action: Tail: Set size of all points -> -1, 20
```

Heights reset each tick; for a taper, loop over the points and set the height by index with Set point size.

### 7. River with flow

**Scenario:** A winding river built from a bezier.

```
Event: System -> On start of layout
  Action: River: Set bezier curve -> 0, 300, 400, 100, 800, 500, 1200, 300, 24
  Action: River: Set size of all points -> -1, 80
  Action: River: Set image offset -> River.ImageOffsetX + -50 * dt, 0
  // Tiled Background action: scrolls the texture along the line
```

### 8. Conveyor belt

**Scenario:** A belt that moves boxes and scrolls its texture at the same speed.

```
Event: System -> On start of layout
  Action: Belt: Set image offset -> Belt.ImageOffsetX + 120 * dt, 0
  // Tiled Background action: scrolls the texture along the line
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
  Action: Bar: Set line -> 0, 0, 0, 200 * (Player.Health / 100), 0, 0
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
Event: System -> On start of layout
  Action: Rope: Pin points to objects -> ChainLink, Pinned
  Action: Rope: Set size of all points -> -1, 12
```

Create ChainLink instances in order so their picking order matches the chain.

### 14. Radar sweep arc

**Scenario:** An arc that spins around a radar dish.

```
Event: System -> Every tick
  Action: Sweep: Set arc -> Radar.X, Radar.Y, 160, Radar.Angle - 20, Radar.Angle, 8
  Action: Sweep: Set line style -> None, Round, 2
```

### 15. Pulse along a wire

**Scenario:** A dashed image scrolls to show a signal travelling.

```
Event: Switch -> On pressed
  Action: Wire: Set instance variable Pulsing -> 1
  Action: System: Wait -> 1
  Action: Wire: Set instance variable Pulsing -> 0
Event: Wire -> Is Pulsing
  Action: Wire: Set image offset -> Wire.ImageOffsetX + 300 * dt, 0
  // Tiled Background action: the dashes travel along the wire while pulsing
```

### 16. Tentacle

**Scenario:** A tentacle that waves and tapers.

```
Event: System -> On start of layout
  Action: Tentacle: Set point count -> 10
  Action: Tentacle: Set wave -> 12, 80, 2, Across the line, Sine
  Action: Tentacle: Set performance -> 0, 4, Disabled
Event: System -> For "i" from 0 to 9
  Action: Tentacle: Set point position -> loopindex, loopindex * 30, 0, 0
  Action: Tentacle: Set point size -> loopindex, -1, 36 - loopindex * 3.6
```

### 17. Level-of-detail on long trails

**Scenario:** Many trails on screen at once.

```
Event: System -> On start of layout
  Condition: System -> Compare two values: TrailCount > 50
  Action: Trail: Set performance -> 16, 1, Enabled
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
  Action: Cable: Set line -> TowerA.X, TowerA.Y, 120, TowerB.X, TowerB.Y, 200
  Action: Cable: Set facing -> Billboard, 0, 0, 0
```

### 21. Combined: animated magic tether with collisions

**Scenario:** A glowing tether that damages enemies touching it.

```
Event: System -> On start of layout
  Action: Tether: Pin point to object -> 0, Mage, 0, None, Pinned
  Action: Tether: Pin point to object -> 1, Orb, 0, None, Pinned
  Action: Tether: Set wave -> 5, 30, 0.4, Across the line, Sine
  Action: Tether: Set image offset -> Tether.ImageOffsetX + 150 * dt, 0
  // Tiled Background action: scrolls the texture along the line
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
**Horror games** animate tentacles, cables and flickering wires with the wave.
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
| waveMagnitude, wavelength, wavePeriod, waveMovement, waveShape | Current wave settings. |
| waveResolution | Mesh steps per segment. |
| renderLOD | Maximum drawn points, or off. |
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
line.SetLine(100, 100, 0, 400, 160, 0);
line.SetPointSize(1, -1, 8);           // width -1 = keep, height 8
line.AddPoint(500, 200, 0, 8);
line.SetWave(6, 40, 0.1, 3, 0);       // magnitude, wavelength, period, movement, shape
line.SetLineStyle(2, 3, 2);            // caps, joins, cross-section points
line.SetFacing(1, 0, 0, 800);          // billboard toward a camera at z 800
line.PinPointToObject(0, hook, "tip", 0, 0);  // face 0 = none, mode 0 = pinned
line.SetPointToNode(1, model, 1, "hand_r");      // node type 0 = mesh, 1 = bone
line.SetEnabled(1);                    // 0 = disabled, 1 = enabled
```

### Reading state from script

```js
line.MeshPointCount;          // number of points
line.MeshGetPointX(i);        // layout X of point i
line.MeshGetPointY(i);
line.MeshGetPointZ(i);
line.MeshGetPointTextureWidth(i);
line.MeshGetPointHeight(i);
line.MeshLineLength;
line.MeshTextureLength;
line.MeshCoordSpace;          // "absolute" | "relative"
line.MeshEnabled;
```

### Listening to events from script

```js
line.on("OnMeshRebuilt", () => console.log("updated", line.MeshTextureLength));
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
  if (line.MeshPointCount !== 2) line.SetLine(a.x, a.y, 0, b.x, b.y, 0);
  line.SetPointPosition(0, a.x, a.y, 0);
  line.SetPointPosition(1, b.x, b.y, 0);
});
```

## 19. Feature Deep-Dive: How the Mesh Works

Construct lets any Sprite or Tiled Background be drawn through a **mesh**, a grid of points in normalised object co-ordinates where (0, 0) is the top-left of the unrotated box and (1, 1) the bottom-right. Points may lie outside that range.

Each rebuild the behavior:

1. Applies the maximum drawn points limit and the co-ordinate space transform to the control points.
2. Subdivides segments by the wave resolution and computes the arc length and tangent at each sample.
3. Builds one **column** per sample: a left and a right vertex at plus and minus the width along the ribbon's width axis, plus the wave offset. Corners emit extra columns for the Bevel and Round join styles, and round caps add four narrowing columns at each end.
4. Converts every vertex from layout space back into the host's normalised box (inverse of position, angle and size) and writes it with `setMeshPoint`, with a Z offset relative to the host and texture co-ordinates derived from arc length.

Because the mesh grid is columns x 2, the whole line is one strip and a change in column count is the only time the mesh is recreated. Texture co-ordinates for a Tiled Background are scaled by the image size divided by the object size, so one unit equals one image repeat regardless of how the host was sized in the editor.

## 20. Tips and Common Mistakes

- **The editor shows the plain object.** Behaviors cannot draw in the Layout View, so the line only appears in preview. Size and place the host to roughly cover the line in the editor for easier selection.
- **The line starts with two points, but grows on demand.** Setting or pinning a point past the end adds points up to that index (gap points sit on the previous last point), so "For each Ball: Pin point Ball.IID to Ball" works directly. Remove point and Set point count shrink it again.
- **Pin instead of Every tick.** Pin points to objects and Pin point to object keep following automatically; choose Once for a one-off move.
- **Height is thickness, width is texture.** A point's height is the line thickness there. Its width is how much image the next segment shows, automatic unless you fix it.
- **Sprites cannot tile or scroll.** Their frame is a spritesheet region, so the image is stretched once along the line. Use a Tiled Background for repeating or scrolling textures.
- **Absolute lines outside the box may be culled.** Enable auto-fit (or size the host to cover the line) so Construct's bounding box matches the visible line.
- **Relative space scales with the object.** Resizing the host stretches the line by the ratio to its creation size. Use absolute space for lines that must stay in layout pixels.
- **Only one Line Renderer per object.** The behavior owns the host mesh.
- **Other mesh actions will be overwritten.** The host's own Set mesh point actions are replaced on the next rebuild.
- **Point colors are gone.** Tint the whole line with the host's color and opacity, or use a gradient image.
- **Wave looks faceted?** Raise the wave resolution, which adds mesh columns between points.
- **Billboard needs a camera position.** The behavior finds the 3D Camera object automatically; if your project has none, pass the camera position as the X, Y, Z of Set facing, otherwise Billboard behaves like Flat.
- **Tubes use Simple joins.** A ring needs a centre, so Miter, Bevel and Round only apply to 2-point ribbons.
- **Relative space with a 3D-rotated host.** The line rotates with the host as expected, but object-following actions only undo the host's 2D angle when converting layout positions into local space. Use Absolute space for lines that attach to other objects.
