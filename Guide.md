# Line Renderer 2D Guide

Line Renderer 2D is a Construct 3 world plugin for drawing procedural lines as dynamic mesh strips, so you can build ropes, beams, trails, rivers, and UI links without spawning many sprite segments. You define or update control points, widths, colors, and rendering settings; paint or import the object's own **image** to texture and tile the stroke; tint it and stack Construct **effects** on top; and the plugin rebuilds the mesh for you — giving cleaner visuals, fewer objects, and event-sheet control over every effect.

> **Changed — texture handling.** The old `Stroke texture` project-file property has been **removed**. The stroke texture is now the object's **editable image**, painted/imported in the Animations Editor exactly like a Sprite (double-click the instance, or use *Edit*). It tiles along the stroke, respects the instance color/opacity filter, and supports effects. Projects that referenced the old property must set the object image instead.

## Table of Contents

1. [Scenarios Where This Addon Excels](#1-scenarios-where-this-addon-excels)
2. [Core Concepts](#2-core-concepts)
3. [Project Setup](#3-project-setup)
4. [Plugin Properties](#4-plugin-properties)
5. [Managing Points and Shape Setup](#5-managing-points-and-shape-setup)
6. [Path Building and Object Linking](#6-path-building-and-object-linking)
7. [Coordinate Space and Transform Behavior](#7-coordinate-space-and-transform-behavior)
8. [Distortion and Appearance](#8-distortion-and-appearance)
9. [Performance Controls](#9-performance-controls)
10. [Actions Reference](#10-actions-reference)
11. [Conditions Reference](#11-conditions-reference)
12. [Expressions Reference](#12-expressions-reference)
13. [Triggers Reference](#13-triggers-reference)
14. [System Use Cases](#14-system-use-cases)
15. [Game Use Cases](#15-game-use-cases)
16. [C3 Debugger](#16-c3-debugger)
17. [Scripting (C3 Script / JavaScript)](#17-scripting-c3-script--javascript)
18. [Feature Deep-Dives](#18-feature-deep-dives)
19. [Tips and Common Mistakes](#19-tips-and-common-mistakes)

## 1. Scenarios Where This Addon Excels

- **Dynamic rope and cable rendering**: Build a line from live object points and update every tick for moving anchors.
- **Laser and beam VFX**: Use UV scrolling plus distortion for animated energy beams without sprite tiling seams.
- **Curved paths and trails**: Generate bezier, arc, and smoothed lines from simple parameters.
- **Node graph and UI connectors**: Connect draggable UI nodes with clean line segments and color states.
- **Water streams and conveyor visuals**: Use repeating textures and UV motion for directional flow effects.
- **Lightning and magic arcs**: Combine object linking, subdivision, and distortion for reactive impact visuals.

## 2. Core Concepts

### The problem this addon solves

Without a mesh line system, developers often place many rotated sprites to fake a curved line. That adds object overhead, visible seams, and event complexity. **Line Renderer 2D** keeps one object per line and rebuilds a **mesh strip** from a **control point** list.

### Key design decisions

- **One instance equals one line**: If you need multiple lines, create multiple instances.
- **Point ownership stays in your events**: The plugin does not simulate rope physics by itself.
- **Per-point width and color**: Width and tint interpolate between points for gradients and tapering.
- **Safe index behavior**: Invalid point indices do not crash events.
- **Automatic mesh rebuild strategy**: Rebuild happens when needed by settings or point changes.

### Key concepts at a glance

| Concept | Meaning |
|---|---|
| **Control Point** | A point with x, y, width, and RGBA data used to build the line. |
| **Mesh Strip** | The generated triangle geometry drawn by the plugin. |
| **Stroke Image** | The object's own editable image, painted/imported like a Sprite and tiled along the line. |
| **UV Scroll** | Texture movement along line length over time. |
| **Distortion** | Vertex offset animation using amplitude, frequency, speed, and axis. |
| **Color Filter** | Instance-wide tint and opacity applied on top of per-point colors. |
| **Effects** | Construct shader effects stacked on the rendered stroke. |
| **Coordinate Space** | Points interpreted as absolute world coordinates or relative local coordinates. |
| **Render LOD** | Cap that reduces rendered point count for performance at distance. |

## 3. Project Setup

1. Add **Line Renderer 2D** to your project as a world object.
2. Drop one instance on a layer.
3. Set `Initial point count` to at least `2`.
4. Optional texture: **double-click the instance** (like a Sprite) to paint or import the object image, then set `Texture tile length` to control how often it repeats along the stroke. Leave the image blank to draw a solid line from per-point colors.
5. In events, define points with actions like `SetPoint`, `AddPoint`, or `SetLine`.
6. Tune distortion, caps, blend mode, and UV scroll. Optionally add Construct **effects** on the object and set the instance **color/opacity** in the Properties Bar.

Example first working setup:

```text
Event: On start of layout
  Action: LineRenderer2D -> "Set line from ({0}, {1}) to ({2}, {3})", 200, 200, 600, 300
  Action: LineRenderer2D -> "Set all widths to {0}", 18
  Action: LineRenderer2D -> "Set all colors to ({0}, {1}, {2}) opacity {3}", 255, 240, 180, 100
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", 120
  // creates a visible animated line immediately
```

## 4. Plugin Properties

| Property | Type | Default | Description |
|---|---|---:|---|
| Initial point count | Integer | 2 | Number of control points allocated at create time. |
| Texture tile length | Float | 64 | World pixels per full texture repeat. |
| UV scroll speed | Float | 0 | Texture movement speed along the stroke. |
| Default width | Float | 16 | Initial point width value. |
| Distort amplitude | Float | 0 | Pixel offset strength for distortion. |
| Distort frequency | Float | 1 | Distortion wave density. |
| Distort speed | Float | 1 | Distortion phase speed. |
| Distort axis | Combo | both | Axis mode: x_only, y_only, both, perpendicular. |
| End cap style | Combo | round | Endpoint style: round, flat, square. |
| Blend mode | Combo | normal | Draw blending mode. |
| Sampling mode | Combo | auto | Texture sampling mode: auto, nearest, linear. |
| Debug points | Check | false | Draw control point markers. |
| Editor preview | Combo | wireframe | Editor draw style: wireframe, solid, animated. |

> **The stroke texture is the object's image, not a property.** Double-click the instance (or context-menu *Edit*) to open the image editor like a Sprite. The image **tiles** along the stroke (`Texture tile length`, `UV scroll speed`), respects the instance **color/opacity** filter shown in the Properties Bar, and supports Construct **effects** (Add effect on the object). Leave the image blank to draw a solid colored line from the per-point colors. The **Editor preview** now draws at the instance's real position, rotation, and size — including inside scene-graph parents — and shows the texture in *solid* / *animated* modes.

## 5. Managing Points and Shape Setup

Use **Setup** and **Point Control** actions when you need direct ownership of point data.

```text
Event: Every tick
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 0, Player.X, Player.Y, 20
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 1, Mouse.X, Mouse.Y, 8
  // simple dynamic two-point beam between player and cursor
```

Gotchas:

- Keep at least 2 points for a visible line.
- Use `IsPointIndexValid` before writing to dynamic indices.

## 6. Path Building and Object Linking

Use **Path Building** actions to generate curves quickly and **Object Following** to pull data from picks.

```text
Event: On start of layout
  Action: LineRenderer2D -> "Build bezier from ({0}, {1}) via ({2}, {3}) and ({4}, {5}) to ({6}, {7}) with {8} segments", 100, 400, 250, 280, 450, 520, 700, 400, 20
  Action: LineRenderer2D -> "Set all widths to {0}", 14
  // generates a smooth S-curve path from parameters
```

```text
Event: Every tick
  Action: LineRenderer2D -> "Connect {0} to {1}", Tower, Enemy
  // two-point tracking line updated every frame
```

Gotchas:

- `ConnectObjects` uses first picked instance of each object.
- `SetPointsFromObjects` follows current pick order.

## 7. Coordinate Space and Transform Behavior

`SetCoordSpace` controls whether points are interpreted in world space or local space relative to the line instance.

```text
Event: On start of layout
  Action: LineRenderer2D -> "Set coordinate space to {0}", "relative"
  Action: LineRenderer2D -> "Set line from ({0}, {1}) to ({2}, {3})", -100, 0, 100, 0
  // line now rotates and scales with the object transform
```

Scene graph / parent objects:

- In **relative** mode the stroke is built through the instance's live world transform, so when the Line Renderer is a **child** of another object (scene graph), it follows the parent's position, rotation, and scale automatically — both at runtime and in the editor preview.
- In **absolute** mode points are literal world coordinates and ignore the instance transform, so a parented instance will not follow its parent. Use relative mode (or update points yourself) when you want parent-following.

Gotchas:

- In relative mode, object width and height affect transformed point spacing.
- Use relative mode for reusable prefabs that move as one unit.

## 8. Distortion and Appearance

Distortion adds procedural movement. Appearance controls texture motion and blending.

```text
Event: Every tick
  Action: LineRenderer2D -> "Set distortion amplitude {0} frequency {1} speed {2}", 10, 2.5, 1.2
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", 180
  Action: LineRenderer2D -> "Set blend mode to {0}", "additive"
  // creates flowing and glowing beam behavior
```

Texture, tiling, color, and effects:

- The stroke samples the object's **image**. `Texture tile length` sets the world-space pixels per repeat; smaller values tile more often. `UV scroll speed` animates the texture along the line for flow/energy looks.
- Tiling uses GPU repeat-wrap, so make the image **seamless left-to-right** to avoid visible seams between repeats.
- The instance **color** and **opacity** (Properties Bar, or `Set opacity` action / `colorRgb` in script) tint the whole stroke on top of per-point colors.
- Add Construct **effects** to the object as you would to a Sprite; they apply to the rendered stroke.

Gotchas:

- High amplitude on thin lines can look noisy.
- For clear art, match texture pattern direction with UV flow direction.
- A blank object image draws a solid line from per-point colors — paint/import the image when you want a textured stroke.

## 9. Performance Controls

Use LOD, distortion resolution, and culling to scale to many lines.

```text
Event: Every 0.25 seconds
  Condition: Distance(LineRenderer2D.X, LineRenderer2D.Y, Camera.X, Camera.Y) > 2000
  Action: LineRenderer2D -> "Set render LOD to {0}", 8
  Action: LineRenderer2D -> "Set distort resolution to {0}", 1
  Action: LineRenderer2D -> "Set frustum culling to {0}", true
  // reduce geometric cost for distant lines
```

Gotchas:

- Very low LOD can flatten important curvature.
- Increase distortion resolution only when ripple smoothness matters on screen.

## 10. Actions Reference

### Setup

| Action | Description |
|---|---|
| SetPointCount | Resize point array to target count and keep valid existing points. |
| AddPoint | Append one point with x, y, width. |
| InsertPoint | Insert one point at index and shift later points. |
| RemovePoint | Remove one point at index when valid and safe. |
| ClearPoints | Reset to a default minimal point setup. |

### Point Control

| Action | Description |
|---|---|
| SetPoint | Set point x, y, and width in one call. |
| SetPointXY | Set point position only. |
| SetPointWidth | Set point width only. |
| SetPointColor | Set per-point tint and opacity. |
| SetAllWidths | Apply one width to all points. |
| SetAllColors | Apply one color and opacity to all points. |

### Path Building

| Action | Description |
|---|---|
| SetLine | Replace shape with a straight two-point line. |
| BuildBezier | Build a sampled cubic bezier into control points. |
| BuildArc | Build an arc path from center and angle range. |
| SmoothPath | Re-sample current path with Catmull-Rom smoothing. |
| ConnectObjects | Build a two-point line between first picked instances. |

### Object Following

| Action | Description |
|---|---|
| SetPointToObject | Write one point position from an object pick. |
| SetPointsFromObjects | Rebuild all points from picked instances. |

### Coordinate Space

| Action | Description |
|---|---|
| SetCoordSpace | Switch between absolute and relative point space. |

### Distortion

| Action | Description |
|---|---|
| SetDistortion | Set amplitude, frequency, and speed together. |
| SetDistortAmplitude | Set distortion strength only. |
| SetDistortFrequency | Set distortion frequency only. |
| SetDistortSpeed | Set distortion animation speed only. |
| SetDistortAxis | Set distortion axis mode. |

### Appearance

| Action | Description |
|---|---|
| SetUVScrollSpeed | Set UV movement speed. |
| SetTextureTileLength | Set world length of one texture repeat. |
| SetBlendMode | Set blend mode for drawing. |
| SetEndCapStyle | Set endpoint geometry style. |
| SetOpacity | Set line master opacity. |

### Performance

| Action | Description |
|---|---|
| SetRenderLOD | Cap rendered point count for lower cost. |
| SetDistortResolution | Set subdivisions used by distortion pass. |
| SetFrustumCulling | Skip drawing when line bounds are off-screen. |

## 11. Conditions Reference

| Condition | Description |
|---|---|
| OnMeshRebuilt | Trigger when a mesh rebuild happened this tick. |
| OnPointCountChanged | Trigger when point count changed. |
| IsPointIndexValid | True when index references an existing point. |
| IsDistortionActive | True when distortion amplitude is greater than zero. |
| IsUVScrolling | True when UV scroll speed is non-zero. |
| IsTextureAssigned | True when the object image has pixels (a stroke texture is present). |
| HasMinimumPoints | True when point count is at least a threshold. |
| IsCulled | True when line was culled on last tick. |
| IsLODActive | True when LOD cap is actively reducing rendered points. |
| IsRelativeSpace | True when coordinate space is relative. |

## 12. Expressions Reference

| Expression | Returns | Description |
|---|---|---|
| PointCount | number | Total control points. |
| GetPointX(index) | number | Point world X for index. |
| GetPointY(index) | number | Point world Y for index. |
| GetPointWidth(index) | number | Point width for index. |
| GetPointR(index) | number | Point red channel in 0-255 range. |
| GetPointG(index) | number | Point green channel in 0-255 range. |
| GetPointB(index) | number | Point blue channel in 0-255 range. |
| GetPointOpacity(index) | number | Point opacity in 0-100 range. |
| LineLength | number | Last built polyline length. |
| VertexCount | number | Last built mesh vertex count. |
| RenderedPointCount | number | Points used in last mesh build after LOD. |
| RenderLOD | number | Active LOD cap, 0 means off. |
| DistortResolution | number | Distortion subdivision count. |
| DistortAmplitude | number | Current distortion amplitude. |
| DistortFrequency | number | Current distortion frequency. |
| DistortSpeed | number | Current distortion speed. |
| UVScrollSpeed | number | Current UV scroll speed. |
| UVScrollOffset | number | Accumulated UV offset. |
| TextureTileLength | number | Current tile length. |
| CoordSpace | string | Current coordinate space key. |

## 13. Triggers Reference

| Trigger | Description |
|---|---|
| OnMeshRebuilt | Fired when mesh data was rebuilt on that tick. |
| OnPointCountChanged | Fired when number of control points changes. |

## 14. System Use Cases

### Point Data System

One-line summary: Creates and updates point records that define shape, width, and tint.

Use case 1:

Scenario: Initialize a predictable line with four points for a guided projectile path.

```text
Event: On start of layout
  Action: LineRenderer2D -> "Set point count to {0}", 4
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 0, 100, 300, 18
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 1, 260, 260, 14
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 2, 420, 320, 12
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 3, 580, 300, 10
```

Use case 2:

Scenario: Pulse point widths for a heartbeat visual while preserving shape.

```text
Event: Every tick
  Action: LineRenderer2D -> "Set point width {0} to {1}", 0, 12 + sine(time * 2) * 4
  Action: LineRenderer2D -> "Set point width {0} to {1}", 1, 10 + sine(time * 2 + 0.4) * 3
  Action: LineRenderer2D -> "Set point width {0} to {1}", 2, 8 + sine(time * 2 + 0.8) * 2
```

Tip: width-only updates are cheaper to reason about than rewriting full point structs.

### Path Generator System

One-line summary: Converts high-level shapes into point sets quickly.

Use case 1:

Scenario: Create an aiming arc preview from player to target zone.

```text
Event: While aiming
  Action: LineRenderer2D -> "Build arc at ({0}, {1}) radius {2} from {3} to {4} with {5} segments", Player.X, Player.Y, 180, -40, 40, 16
```

Use case 2:

Scenario: Smooth a hand-authored path after waypoint edits.

```text
Event: On button "Smooth" clicked
  Action: LineRenderer2D -> "Smooth path with {0} subdivisions", 5
```

Tip: smooth only when path changes, not every tick.

### Linking System

One-line summary: Binds line endpoints or full point sets to picked objects.

Use case 1:

Scenario: Draw line from selected unit to hovered enemy.

```text
Event: Every tick
  Condition: Unit is selected
  Condition: Enemy is hovered
  Action: LineRenderer2D -> "Connect {0} to {1}", Unit, Enemy
```

Use case 2:

Scenario: Build a route line through picked waypoint instances.

```text
Event: On route updated
  Action: LineRenderer2D -> "Set points from objects {0}", Waypoint
```

Tip: pick order matters when converting objects to points.

### Visual Motion System

One-line summary: Animates line appearance with UV and distortion controls.

Use case 1:

Scenario: Turn static line into animated electric beam.

```text
Event: On beam enabled
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", 260
  Action: LineRenderer2D -> "Set distortion amplitude {0} frequency {1} speed {2}", 14, 3.2, 1.6
  Action: LineRenderer2D -> "Set distort axis to {0}", "perpendicular"
```

Use case 2:

Scenario: Calm beam down after overload phase.

```text
Event: On overload ended
  Action: LineRenderer2D -> "Set distortion amplitude {0}", 2
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", 80
```

Tip: axis changes can do more for style than larger amplitude values.

### Runtime Cost System

One-line summary: Reduces mesh complexity and updates when quality can be lowered.

Use case 1:

Scenario: Auto-adjust quality from camera distance.

```text
Event: Every 0.2 seconds
  Condition: distance(LineRenderer2D.X, LineRenderer2D.Y, Camera.X, Camera.Y) > 1500
  Action: LineRenderer2D -> "Set render LOD to {0}", 6
  Action: LineRenderer2D -> "Set frustum culling to {0}", true
```

Use case 2:

Scenario: Restore quality when line is close to camera.

```text
Event: Every 0.2 seconds
  Condition: distance(LineRenderer2D.X, LineRenderer2D.Y, Camera.X, Camera.Y) <= 1500
  Action: LineRenderer2D -> "Set render LOD to {0}", 0
  Action: LineRenderer2D -> "Set distort resolution to {0}", 2
```

Tip: for fast games, evaluate distance less often than every tick.

### Save and Restore System

One-line summary: Preserves line state through save/load using plugin runtime serialization.

Use case 1:

Scenario: Save puzzle cable state and restore exactly after load.

```text
Event: On save requested
  Action: System -> "Save game to slot", "slotA"

Event: On load requested
  Action: System -> "Load game from slot", "slotA"
```

Use case 2:

Scenario: Confirm loaded line integrity by reading value expressions.

```text
Event: On game loaded
  Action: Text -> "Set text", "Points: " & LineRenderer2D.PointCount & " Length: " & LineRenderer2D.LineLength
```

Tip: after load, your event logic can still overwrite values on first tick, so gate init events.

## 15. Game Use Cases

### 1. Minimal Two-Point Beam

Scenario: Draw a simple beam between player and mouse cursor.

```text
Layer structure:
  Gameplay
    Player
    LineRenderer2D
```

```text
Event: Every tick
  Action: LineRenderer2D -> "Set point count to {0}", 2
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 0, Player.X, Player.Y, 18
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 1, Mouse.X, Mouse.Y, 8
```

Note: keep this as your first smoke test when integrating the addon.

### 2. Boss Charge Laser

Scenario: Increase width and glow before firing.

```text
Layer structure:
  Gameplay
    Boss
    FX
      LineRenderer2D
```

```text
Event: BossState = "Charging"
  Action: LineRenderer2D -> "Connect {0} to {1}", Boss, Player
  Action: LineRenderer2D -> "Set all widths to {0}", lerp(6, 30, ChargeProgress)
  Action: LineRenderer2D -> "Set blend mode to {0}", "additive"
```

Note: combine with camera shake only after full charge for impact.

### 3. Moving Rope Between Hooks

Scenario: Keep rope connected between two moving platforms.

```text
Event: Every tick
  Action: LineRenderer2D -> "Connect {0} to {1}", HookA, HookB
  Action: LineRenderer2D -> "Set all widths to {0}", 10
```

Note: for sag, insert intermediate points and offset their Y values.

### 4. Curved Projectile Preview

Scenario: Show predicted arc while player aims.

```text
Event: While aiming
  Action: LineRenderer2D -> "Build bezier from ({0}, {1}) via ({2}, {3}) and ({4}, {5}) to ({6}, {7}) with {8} segments", Player.X, Player.Y, Player.X+120, Player.Y-80, Mouse.X-120, Mouse.Y-80, Mouse.X, Mouse.Y, 18
```

Note: run this only while aiming UI is active.

### 5. Lightning Strike Effect

Scenario: Spawn a temporary arc from caster to target.

```text
Event: On spell cast
  Action: LineRenderer2D -> "Connect {0} to {1}", Caster, Target
  Action: LineRenderer2D -> "Set distortion amplitude {0} frequency {1} speed {2}", 20, 4, 2
  Action: LineRenderer2D -> "Set blend mode to {0}", "additive"
```

Note: destroy instance after short timer for burst style.

### 6. Rail Path for Grind Mechanic

Scenario: Build and smooth a static rail path on start.

```text
Event: On start of layout
  Action: LineRenderer2D -> "Set points from objects {0}", RailNode
  Action: LineRenderer2D -> "Smooth path with {0} subdivisions", 4
  Action: LineRenderer2D -> "Set all widths to {0}", 12
```

Note: lock node pick order to maintain path direction.

### 7. River Flow

Scenario: Build waterline visual with UV motion.

```text
Event: On start of layout
  Action: LineRenderer2D -> "Set points from objects {0}", RiverNode
  Action: LineRenderer2D -> "Set texture tile length to {0}", 96
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", 70
```

Note: use low distortion for calm water and higher near rapids.

### 8. Data Cable UI Link

Scenario: Connect two UI panels with a glowing link.

```text
Layer structure:
  UI
    PanelA
    PanelB
    LineRenderer2D
```

```text
Event: Every tick
  Action: LineRenderer2D -> "Connect {0} to {1}", PanelA, PanelB
  Action: LineRenderer2D -> "Set all widths to {0}", 4
  Action: LineRenderer2D -> "Set all colors to ({0}, {1}, {2}) opacity {3}", 90, 220, 255, 100
```

Note: keep line on a dedicated UI FX layer for sorting clarity.

### 9. Grapple Rope

Scenario: Draw rope from player to grapple point.

```text
Event: GrappleActive
  Action: LineRenderer2D -> "Connect {0} to {1}", Player, GrappleAnchor
  Action: LineRenderer2D -> "Set end cap style to {0}", "round"
```

Note: switch to flat cap for mechanical cable visuals.

### 10. Multi-Segment Snake Trail

Scenario: Trail follows historical positions sampled over time.

```text
Event: Every 0.05 seconds
  Action: Push Player.X, Player.Y into arrays

Event: Every tick
  Action: LineRenderer2D -> "Set point count to {0}", TrailCount
  Action: Repeat TrailCount times
    Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", loopindex, TrailX[loopindex], TrailY[loopindex], lerp(18, 2, loopindex / max(1, TrailCount-1))
```

Note: cap array size to avoid unbounded cost.

### 11. Shield Ring Segment

Scenario: Render an arc segment for directional shield state.

```text
Event: Every tick
  Action: LineRenderer2D -> "Build arc at ({0}, {1}) radius {2} from {3} to {4} with {5} segments", Player.X, Player.Y, 72, ShieldStartAngle, ShieldEndAngle, 20
```

Note: animate arc angles for rotating barrier effects.

### 12. Route Planner Preview

Scenario: Show route through selected waypoints before confirming move.

```text
Event: On route edit
  Action: LineRenderer2D -> "Set points from objects {0}", SelectedWaypoint
  Action: LineRenderer2D -> "Set all colors to ({0}, {1}, {2}) opacity {3}", 255, 210, 90, 85
```

Note: color-code route validity by swapping tint instantly.

### 13. Heat Beam Cooling State

Scenario: Beam slows and dims while cooling down.

```text
Event: BeamState = "Cooldown"
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", lerp(220, 20, CooldownProgress)
  Action: LineRenderer2D -> "Set opacity to {0}", lerp(100, 30, CooldownProgress)
  Action: LineRenderer2D -> "Set distortion amplitude {0}", lerp(16, 0, CooldownProgress)
```

Note: this creates readable combat state feedback.

### 14. Camera-Distance LOD Swap

Scenario: Lower detail for lines far from camera.

```text
Event: Every 0.2 seconds
  Condition: distance(LineRenderer2D.X, LineRenderer2D.Y, Camera.X, Camera.Y) > 1200
  Action: LineRenderer2D -> "Set render LOD to {0}", 10

Event: Every 0.2 seconds
  Condition: distance(LineRenderer2D.X, LineRenderer2D.Y, Camera.X, Camera.Y) <= 1200
  Action: LineRenderer2D -> "Set render LOD to {0}", 0
```

Note: pair with culling to reduce off-screen load further.

### 15. Triggered Mesh Analytics

Scenario: Log mesh stats each time geometry rebuilds.

```text
Event: LineRenderer2D -> On mesh rebuilt
  Action: DebugText -> "Set text", "Pts: " & LineRenderer2D.PointCount & " Vert: " & LineRenderer2D.VertexCount & " Len: " & LineRenderer2D.LineLength
```

Note: useful while tuning path resolution and distortion settings.

### 16. Relative Space Weapon Slash Prefab

Scenario: Use relative points so slash line follows rotating weapon object.

```text
Event: On prefab created
  Action: LineRenderer2D -> "Set coordinate space to {0}", "relative"
  Action: LineRenderer2D -> "Set line from ({0}, {1}) to ({2}, {3})", -80, 0, 80, 0
```

Note: animate host object transform instead of rewriting points every frame.

### 17. Timeline-Cutscene Link

Scenario: Connect characters during dialog with smooth bezier line.

```text
Event: During cutscene
  Action: LineRenderer2D -> "Build bezier from ({0}, {1}) via ({2}, {3}) and ({4}, {5}) to ({6}, {7}) with {8} segments", ActorA.X, ActorA.Y-20, Camera.X-120, Camera.Y-140, Camera.X+120, Camera.Y-140, ActorB.X, ActorB.Y-20, 14
```

Note: keep blend mode normal for cinematic readability.

### 18. Electricity Network Visualization

Scenario: Draw many node links and show overload links in red.

```text
Event: For each PowerLink
  Action: LinkLine -> "Connect {0} to {1}", LinkSource, LinkTarget
  Action: LinkLine -> "Set all colors to ({0}, {1}, {2}) opacity {3}", choose(IsOverloaded, 255, 120), choose(IsOverloaded, 80, 220), 120, 100
```

Note: map one plugin instance per network edge for independent styling.

### 19. Puzzle Wire Rewiring

Scenario: Player drags wire endpoint and line updates live.

```text
Event: While dragging wire
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 0, SocketA.X, SocketA.Y, 9
  Action: LineRenderer2D -> "Set point {0} to ({1}, {2}) width {3}", 1, Mouse.X, Mouse.Y, 9
```

Note: confirm placement then snap point 1 to target socket.

### 20. Edge Case Cleanup on Destroy

Scenario: Ensure temporary line does not survive effect owner destruction.

```text
Event: On Enemy destroyed
  Action: TempBeam -> Destroy
```

Note: always destroy transient line instances to avoid stale world objects.

### 21. Persistence Validation Case

Scenario: Verify save/load restores point count and style.

```text
Event: On game loaded
  Action: DebugText -> "Set text", "Loaded points=" & LineRenderer2D.PointCount & " UV=" & LineRenderer2D.UVScrollSpeed & " LOD=" & LineRenderer2D.RenderLOD
```

Note: this catches accidental post-load reset logic in your own events.

### Other game use cases

**Platformer:** Use ropes, ziplines, and moving hazard beams that react to level motion and switches.

**Metroidvania:** Render energy conduits that animate only in powered sectors and change color by unlock tier.

**Top-down shooter:** Build directional warning lasers and boss telegraph lines with additive blend for clarity.

**Bullet hell:** Draw pattern guides and dynamic bullet stream lanes that pulse before firing cycles.

**Racing:** Use lane guides, drafting lines, and checkpoint ribbons that flow with speed boosts.

**Tower defense:** Connect tower chain-lightning arcs to first target and recolor links by damage type.

**RTS:** Show rally paths, supply links, and command chains between units and structures.

**City builder:** Visualize utility networks like power, water, and data with line color indicating load.

**Puzzle:** Build wiring, mirror-laser paths, and route validation overlays with immediate visual feedback.

**Survival crafting:** Display tether lines, cable runs, and power-grid diagnostics between devices.

**Action RPG:** Render temporary slash trails, spell tethers, and healing beams between allies.

**Tactical RPG:** Show projected movement splines and skill range arcs before confirming actions.

**Stealth:** Draw vision cones as edge lines or security beam paths that enable or disable by alarm state.

**Sports:** Use pass prediction lines and curve previews for trick shots or set-piece planning.

**Visual novel:** Add stylized scene connectors and thematic thread effects during dialogue transitions.

**Rhythm:** Draw lane pulses and beat-synced energy streams that scroll in time with song BPM.

**Idle game:** Visualize production chains and resource transfer links across systems on one dashboard.

**Educational:** Show vector paths, wave motion, and graph links for interactive learning scenes.

**Simulation:** Render traffic flow corridors and signal routing overlays in management UIs.

**Horror:** Use flickering unstable power lines and occult tether effects that intensify with events.

## 16. C3 Debugger

Line Renderer 2D exposes debugger properties through a section titled `$MeshStroke`.

How to open:

1. Preview your project.
2. Open the Construct debugger panel.
3. Select the Line Renderer 2D instance in object list.
4. Expand the `$MeshStroke` section.

| Field | Meaning |
|---|---|
| $pointCount | Current control point count. |
| $vertexCount | Vertex count of last built mesh. |
| $lineLength | Last measured polyline length. |
| $distortAmplitude | Active distortion amplitude. |
| $uvScrollOffset | Accumulated UV offset. |
| $blendMode | Active blend mode key. |
| $meshRebuildCount | Total rebuilds since instance start. |
| $lastTickRebuilt | Whether last tick rebuilt mesh. |
| $renderLOD | LOD cap value or off. |
| $renderedPointCount | Point count used in last build after LOD. |
| $distortResolution | Distortion subdivision value. |
| $isCulled | Last culling result. |
| $coordSpace | Current coordinate space key. |

## 17. Scripting (C3 Script / JavaScript)

This addon has many `expose: true` ACEs and runtime public getters, so script integration is available.

### Accessing the plugin

Plugin access comes from the object name in your project, not the addon id string.

```js
// If your object is named LineRenderer2D in the project:
const inst = runtime.objects.LineRenderer2D.getFirstInstance();
```

### Calling actions from script

Exposed ACE actions become prototype methods with PascalCase names from file names.
Examples: `a.SetPoint.js` -> `SetPoint(...)`, `a.BuildBezier.js` -> `BuildBezier(...)`.
Combo parameters are received as 0-based indices in script calls.

```js
inst.SetPointCount(4);
inst.SetPoint(0, 100, 100, 16);
inst.SetPoint(1, 220, 120, 14);
inst.SetPoint(2, 340, 150, 10);
inst.SetPoint(3, 460, 180, 8);
inst.SetBlendMode(1); // 0 normal, 1 additive, 2 multiply, 3 screen
inst.SetCoordSpace(1); // 0 absolute, 1 relative
```

The instance **color filter** and **opacity** use the standard world-instance surface (there is no dedicated color action):

```js
inst.colorRgb = [1, 0.6, 0.3]; // tint the whole stroke (values 0-1)
inst.opacity  = 0.5;           // master opacity (0-1)
// per-point colors are separate: inst.SetAllColors(255, 200, 120, 100);
```

### Reading state from script

Expressions are for event sheets. Script reads runtime methods and getters directly.

```js
const count = inst.MeshPointCount;
const x0 = inst.MeshGetPointX(0);
const y0 = inst.MeshGetPointY(0);
const width0 = inst.MeshGetPointWidth(0);
const r0 = inst.MeshGetPointR(0);
const g0 = inst.MeshGetPointG(0);
const b0 = inst.MeshGetPointB(0);
const a0 = inst.MeshGetPointOpacity(0);

const len = inst.MeshLineLength;
const verts = inst.MeshVertexCount;
const rendered = inst.MeshRenderedPointCount;
const lod = inst.MeshRenderLOD;
const distAmp = inst.MeshDistortAmplitude;
const distFreq = inst.MeshDistortFrequency;
const distSpeed = inst.MeshDistortSpeed;
const uvSpeed = inst.MeshUVScrollSpeed;
const uvOffset = inst.MeshUVScrollOffset;
const tileLen = inst.MeshTextureTileLength;
const space = inst.MeshCoordSpace;
```

### Listening to events from script

This plugin runtime provides `on(tag, callback)` and `off(tag, callback)`.
Supported tags are `OnMeshRebuilt` and `OnPointCountChanged`.

```js
function onRebuild() {
  console.log("Line rebuilt", inst.MeshVertexCount);
}

inst.on("OnMeshRebuilt", onRebuild);
// later
inst.off("OnMeshRebuilt", onRebuild);
```

### Looping patterns

Use count plus indexed getters like a standard for-loop.

```js
for (let i = 0; i < inst.MeshPointCount; i++) {
  const x = inst.MeshGetPointX(i);
  const y = inst.MeshGetPointY(i);
  const w = inst.MeshGetPointWidth(i);
  // process point data
}
```

### Complete script example

```js
function setupLaser(runtime, source, target) {
  const inst = runtime.objects.LineRenderer2D.getFirstInstance();
  if (!inst) return;

  inst.SetPointCount(2);
  inst.SetAllColors(120, 240, 255, 100);
  inst.SetAllWidths(10);
  inst.SetBlendMode(1);
  inst.SetUVScrollSpeed(180);
  inst.SetDistortion(8, 2.2, 1.1);

  const onRebuild = () => {
    const info = `len=${inst.MeshLineLength.toFixed(1)} verts=${inst.MeshVertexCount}`;
    console.log(info);
  };
  inst.on("OnMeshRebuilt", onRebuild);

  runtime.addEventListener("tick", () => {
    inst.ConnectObjects(source, target);
    if (inst.MeshLineLength > 900) {
      inst.SetRenderLOD(8);
    } else {
      inst.SetRenderLOD(0);
    }
  });
}
```

## 18. Feature Deep-Dives

### Coordinate Space Strategy

`absolute` is best when points come from many world references and must ignore object transform.

`relative` is best when line shape is local to one object, for example weapon slashes, engine trails, or attachable FX.

Comparison:

| Mode | Best for | Tradeoff |
|---|---|---|
| absolute | World-linked lines between objects | Requires explicit point updates for motion |
| relative | Prefab-like reusable effects that move/rotate together | Object transform changes all points at once |

Example swap logic:

```text
Event: On state changed to "Attached"
  Action: LineRenderer2D -> "Set coordinate space to {0}", "relative"

Event: On state changed to "Detached"
  Action: LineRenderer2D -> "Set coordinate space to {0}", "absolute"
```

### Distortion and LOD Balancing

High distortion plus high resolution creates smooth effects but costs more vertices. Use quality tiers.

| Tier | Distort amplitude | Distort resolution | Render LOD |
|---|---:|---:|---:|
| Near camera | 12 | 2 | 0 |
| Mid distance | 8 | 1 | 20 |
| Far distance | 2 | 1 | 8 |

```text
Event: Every 0.25 seconds
  Condition: DistanceToCamera < 600
  Action: LineRenderer2D -> "Set distortion amplitude {0}", 12
  Action: LineRenderer2D -> "Set distort resolution to {0}", 2
  Action: LineRenderer2D -> "Set render LOD to {0}", 0
```

### Texture, Tiling, Color, and Effects

The stroke is textured by the object's **own image** — there is no texture property to assign. Edit it like a Sprite:

1. Double-click the instance in the Layout View (or right-click → *Edit*) to open the Animations Editor.
2. Paint or import/paste your stroke texture. Make it **seamless left-to-right** so tiled repeats have no seam.
3. Back in events, control how it maps and moves:

```text
Event: On start of layout
  Action: LineRenderer2D -> "Set texture tile length to {0}", 96   // pixels per repeat
  Action: LineRenderer2D -> "Set UV scroll speed to {0}", 70       // flow animation
```

How the layers combine:

| Layer | Set by | Notes |
|---|---|---|
| Stroke image | Object image (edit like a Sprite) | Tiled along the line; blank image = solid line |
| Per-point color | `SetPointColor`, `SetAllColors` | Interpolates between points for gradients/tapering |
| Instance color filter | Properties Bar / `colorRgb` in script | Tints the whole stroke on top of per-point colors |
| Master opacity | `SetOpacity` action | Multiplies the whole stroke |
| Blend mode | `SetBlendMode` action / property | `additive` for glow, `multiply` for shadowing, etc. |
| Effects | Add effect on the object (like a Sprite) | Applied to the final rendered stroke |

Tips:

- **Tiling needs `IsTiled` repeat-wrap**, which the addon enables for you — so UVs simply repeat as the line gets longer. You do not need to tile the texture by hand.
- Use a tall, thin seamless image: width tiles **along** the line, height maps **across** the stroke width (edge to edge).
- For energy/laser looks, combine `additive` blend, `UV scroll speed`, and a soft gradient image.
- Effects (glow, warp, tint) stack on top of distortion — keep distortion modest when an effect already adds movement.

## 19. Tips and Common Mistakes

- Keep point indices in range, or guard with `IsPointIndexValid` for dynamic loops.
- Remember combo values in script are numeric indices, not string labels.
- Do not overuse `SmoothPath` every tick; run it when source points change.
- Relative space changes how transforms apply, so verify width and scale interactions.
- If a line looks static, check `UVScrollSpeed` and `DistortAmplitude` are non-zero.
- If color appears wrong, verify you are passing RGB 0-255 and opacity 0-100.
- To texture a stroke, edit the **object image** (double-click, like a Sprite) — there is no texture property to assign anymore.
- For clean tiling, make the image **seamless left-to-right**; the addon repeats it for you (no manual tiling needed).
- A textured stroke that looks blank usually means the object image is empty — paint or import it.
- Per-point color, the instance color filter, and effects are independent layers — combine them deliberately rather than fighting one with another.
- The editor preview now follows the instance's position, rotation, size, and scene-graph parent — use *solid* or *animated* preview to see the texture in the Layout View.
- Use debugger fields to confirm whether mesh is rebuilding too often.
- Enable frustum culling for many off-screen lines.
- Use one line instance per independent visual state.
- Destroy temporary line instances after short-lived effects to avoid clutter.
