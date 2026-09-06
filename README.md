<img src="./src/icon.svg" width="100" /><br>
# Line Renderer
<i>Draw a Sprite or Tiled Background as a line, rope or beam along a path of points using mesh distortion, in 2D or 3D.</i> <br>
### Version 2.1.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/releases/download/salmanshh_line_renderer-2.1.0.0.c3addon/salmanshh_line_renderer-2.1.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/releases) </sub> <br>

#### What's New in 2.1.0.0
- **Added:** - Pin point to object and Pin points to objects: points follow instances (or one of their image points, including 3D shape faces) every tick, with a Once mode for a one-off move. Unpin point (-1 for all) and Is point pinned.
- **Added:** - Setting or pinning a point past the end of the list grows the list, so per-IID loops work without setting the point count first.
- **Added:** - Per-point width and height: a point's height is the line thickness there and its width is the texture width of the segment starting at it (0 automatic, a value fixes it so the image stretches with the segment). Set point size, Set size of all points, PointHeight, PointWidth and TextureLength.
- **Added:** - With Auto-fit on, changing the object's height (editor, Set size, tween) scales the rope thickness to match.
- **Added:** - Wave shapes (sine, triangle, sawtooth, reverse sawtooth, square) and negative wave periods to reverse direction.
- **Added:** - Set line style (end caps, joins, cross-section points), Set facing (camera position or up vector) and Set performance (maximum drawn points, wave resolution, off-screen culling).
- **Changed:** - Texture handling is left entirely to the host object. Construct clamps mesh texture co-ordinates to the object's own box, so Auto-fit now sizes the object as the unrolled rope (texture length by thickness at the line's centre). A Tiled Background tiles at its own image scale and scrolls with its own Set image offset; a Sprite stretches its frame. The Texture scroll speed property and actions were removed in favour of the host's image offset.
- **Changed:** - Defaults are now Absolute co-ordinate space with Auto-fit on, so a pinned rope resizes its object to cover the line out of the box; the initial ribbon is placed on the object in layout co-ordinates.
- **Changed:** - Properties Bar reduced to Initial point count, End caps, Facing, Auto-fit to line, Joins, Cross-section points and Enabled (always last). Co-ordinate space and the wave are runtime-only actions.
- **Changed:** - Distortion is now the Wave, described like the Sine behavior: Set wave takes magnitude in pixels, wavelength in pixels, period in seconds, movement (horizontal, vertical, both, across the line, Z elevation) and shape; Set wave magnitude animates it. Replaces the distortion amplitude, frequency, speed, axis and resolution ACEs.
- **Changed:** - ACE set consolidated to 23 actions, 7 conditions and 11 expressions: Add point, Insert point, Set point position and Set line take a Z elevation (the 3D variants are gone); Pin point to object absorbs Set point to object and Set point to image point; Pin points to objects absorbs Set points from objects; Set point size replaces the width, height, texture and rest-length actions; Set line between objects, Clear points, Fit object to line, the per-setting appearance and performance actions, Point exists, Is culled and the derived state expressions were removed.
- **Changed:** - Point width parameters are now heights (full line thickness, like the object height) instead of half-widths.
- **Fixed:** - Host set-up no longer depends on the _postCreate hook (falls back to the first tick), an action run before the first tick is no longer overwritten by the default ribbon, and mesh API errors are reported to the console once instead of being swallowed.
- **Fixed:** - Tiled Background textures no longer stretch their last pixel column past the object's own repeat count.

<sub>[View full changelog](#changelog)</sub>

---
<b><u>Author:</u></b> SalmanShh <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files
| Description | Download |
| --- | --- |
| Line Renderer Example project | [<img src="https://placehold.co/120x30/4493f8/FFF?text=Download&font=montserrat" width="120"/>](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/raw/refs/heads/main/examples/Line%20Renderer%20Example%20project.c3p) |

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Initial point count | The number of points the line starts with. They are spread across the object so it initially looks unchanged. | integer |
| End caps | The shape of the start and end of the line. None cuts off at the end point; Square and Round extend by half the thickness. | combo |
| Facing | How the width of the line is oriented in 3D. Flat stays in the layout plane, Billboard faces the camera, Up vector follows the up vector. | combo |
| Auto-fit to line | Absolute co-ordinate space only: after each update, size the object to the unrolled line (length by thickness) at the line's centre. This makes a Tiled Background tile at its own image scale and scroll with its own image offset. | check |
| Joins | How corners between segments are drawn. Simple is cheapest but thins at corners, Miter is sharp, Bevel is chipped, Round is rounded. | combo |
| Cross-section points | The number of points around the line. 2 draws a flat ribbon; 3 or more draws a 3D tube (joins become Simple). | integer |
| Enabled | Whether the behavior is initially enabled. | check |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Set facing | Set how the line width is oriented in 3D. Flat stays in the layout plane. Billboard faces the camera: X, Y, Z give a camera position, or all 0 to use the 3D Camera object. Up vector follows the up direction given by X, Y, Z. | Facing             *(combo)* <br>X             *(number)* <br>Y             *(number)* <br>Z             *(number)* <br> |
| Set line style | Set the shape of the line ends, how corners are drawn, and the number of points around the line (2 = flat ribbon, 3 or more = 3D tube). | End caps             *(combo)* <br>Joins             *(combo)* <br>Cross-section points             *(number)* <br> |
| Set auto-fit to line | Enable or disable sizing the object to the unrolled line (texture length by thickness) after each update (absolute co-ordinate space only). | State             *(combo)* <br> |
| Set co-ordinate space | Set whether points are in layout co-ordinates (absolute) or relative to the object (relative). | Co-ordinate space             *(combo)* <br> |
| Set wave | Set the wave that ripples the line: how far points move, the length of one wave, seconds per cycle, the direction points are pushed, and the wave shape. | Magnitude             *(number)* <br>Wavelength             *(number)* <br>Period             *(number)* <br>Movement             *(combo)* <br>Wave             *(combo)* <br> |
| Set wave magnitude | Set how far the wave pushes points, in pixels. 0 turns the wave off; animate it to fade a wave in or out. | Magnitude             *(number)* <br> |
| Pin points to objects | Replace all points with one per picked instance of an object (in picking order) and, when pinned, keep each point following its instance every tick. | Object             *(object)* <br>Mode             *(combo)* <br> |
| Pin point to object | Move a point to an image point of the first picked instance (with its Z elevation) and, when pinned, keep following it every tick. Setting a point past the end adds points up to it. | Index             *(number)* <br>Object             *(object)* <br>Image point             *(any)* <br>Face             *(combo)* <br>Mode             *(combo)* <br> |
| Set point to 3D model node | Move a point to the position of a mesh or bone node of the first picked 3D model instance, including its Z elevation. | Index             *(number)* <br>Object             *(object)* <br>Node type             *(combo)* <br>Node name             *(string)* <br> |
| Unpin point | Stop a point following its pinned instance (the point keeps its position). Use -1 to unpin all points. | Index             *(number)* <br> |
| Set arc | Replace all points with an arc around a position. | Center X             *(number)* <br>Center Y             *(number)* <br>Radius             *(number)* <br>Start angle             *(number)* <br>End angle             *(number)* <br>Segments             *(number)* <br> |
| Set bezier curve | Replace all points with a cubic bezier curve. | Start X             *(number)* <br>Start Y             *(number)* <br>Control 1 X             *(number)* <br>Control 1 Y             *(number)* <br>Control 2 X             *(number)* <br>Control 2 Y             *(number)* <br>End X             *(number)* <br>End Y             *(number)* <br>Segments             *(number)* <br> |
| Set line | Replace all points with a straight line between two positions. | Start X             *(number)* <br>Start Y             *(number)* <br>Start Z elevation             *(number)* <br>End X             *(number)* <br>End Y             *(number)* <br>End Z elevation             *(number)* <br> |
| Smooth line | Replace the points with a smooth curve passing through them. | Subdivisions             *(number)* <br> |
| Set performance | Limit how many points are used to draw the line (0 = all), set how many mesh steps each segment is split into for the wave, and whether updates are skipped while the line is off-screen. | Maximum drawn points             *(number)* <br>Wave resolution             *(number)* <br>Off-screen culling             *(combo)* <br> |
| Set size of all points | Set the width (texture width per segment: 0 = automatic, a value fixes it) and height (line thickness) of every point. Use -1 to keep a value. | Width             *(number)* <br>Height             *(number)* <br> |
| Set point position | Set the position and Z elevation of a point. Setting a point past the end adds points up to it. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Z elevation             *(number)* <br> |
| Set point size | Set a point's width (texture width of the segment starting at it: 0 = automatic, a value fixes it so the image stretches with the segment) and height (line thickness). Use -1 to keep a value. | Index             *(number)* <br>Width             *(number)* <br>Height             *(number)* <br> |
| Add point | Add a point to the end of the line. | X             *(number)* <br>Y             *(number)* <br>Z elevation             *(number)* <br>Height             *(number)* <br> |
| Insert point | Insert a point at an index, moving later points up by one. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Z elevation             *(number)* <br>Height             *(number)* <br> |
| Remove point | Remove the point at an index. A line always keeps at least two points. | Index             *(number)* <br> |
| Set enabled | Enable or disable the line. While disabled the object is drawn normally. | State             *(combo)* <br> |
| Set point count | Set the number of points in the line, adding points at the end or removing points from the end. | Count             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| On line updated | Triggered after the line's mesh has been updated. |  |
| On point count changed | Triggered when a point is added or removed. |  |
| Compare point count | Compare the number of points in the line. | Comparison *(cmp)* <br>Count *(number)* <br> |
| Compare co-ordinate space | True if the line uses the given co-ordinate space. | Co-ordinate space *(combo)* <br> |
| Is enabled | True if the line is currently enabled. |  |
| Is point pinned | True if the point is following a pinned instance. | Index *(number)* <br> |
| Is wave active | True if the wave magnitude is greater than 0. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| LineLength | The length of the line, in pixels. | number |  | 
| PointCount | The number of points in the line. | number |  | 
| PointHeight | The line thickness at a point, in pixels. | number | Index *(number)* <br> | 
| PointWidth | The texture width of the segment starting at a point, in pixels: its fixed width if set, otherwise its current length. | number | Index *(number)* <br> | 
| PointX | The layout X co-ordinate of a point. | number | Index *(number)* <br> | 
| PointY | The layout Y co-ordinate of a point. | number | Index *(number)* <br> | 
| PointZ | The layout Z elevation of a point. | number | Index *(number)* <br> | 
| TextureLength | The texture length of the line, in pixels (the object width after Auto-fit). Equals LineLength unless some segments have a fixed width. | number |  | 
| Wavelength | The length of one full wave along the line, in pixels. | number |  | 
| WaveMagnitude | How far the wave pushes points, in pixels. | number |  | 
| WavePeriod | Seconds per wave cycle (0 = still). | number |  | 


---
## Changelog

**2.1.0.0**
- **Added:** - Pin point to object and Pin points to objects: points follow instances (or one of their image points, including 3D shape faces) every tick, with a Once mode for a one-off move. Unpin point (-1 for all) and Is point pinned.
- **Added:** - Setting or pinning a point past the end of the list grows the list, so per-IID loops work without setting the point count first.
- **Added:** - Per-point width and height: a point's height is the line thickness there and its width is the texture width of the segment starting at it (0 automatic, a value fixes it so the image stretches with the segment). Set point size, Set size of all points, PointHeight, PointWidth and TextureLength.
- **Added:** - With Auto-fit on, changing the object's height (editor, Set size, tween) scales the rope thickness to match.
- **Added:** - Wave shapes (sine, triangle, sawtooth, reverse sawtooth, square) and negative wave periods to reverse direction.
- **Added:** - Set line style (end caps, joins, cross-section points), Set facing (camera position or up vector) and Set performance (maximum drawn points, wave resolution, off-screen culling).
- **Changed:** - Texture handling is left entirely to the host object. Construct clamps mesh texture co-ordinates to the object's own box, so Auto-fit now sizes the object as the unrolled rope (texture length by thickness at the line's centre). A Tiled Background tiles at its own image scale and scrolls with its own Set image offset; a Sprite stretches its frame. The Texture scroll speed property and actions were removed in favour of the host's image offset.
- **Changed:** - Defaults are now Absolute co-ordinate space with Auto-fit on, so a pinned rope resizes its object to cover the line out of the box; the initial ribbon is placed on the object in layout co-ordinates.
- **Changed:** - Properties Bar reduced to Initial point count, End caps, Facing, Auto-fit to line, Joins, Cross-section points and Enabled (always last). Co-ordinate space and the wave are runtime-only actions.
- **Changed:** - Distortion is now the Wave, described like the Sine behavior: Set wave takes magnitude in pixels, wavelength in pixels, period in seconds, movement (horizontal, vertical, both, across the line, Z elevation) and shape; Set wave magnitude animates it. Replaces the distortion amplitude, frequency, speed, axis and resolution ACEs.
- **Changed:** - ACE set consolidated to 23 actions, 7 conditions and 11 expressions: Add point, Insert point, Set point position and Set line take a Z elevation (the 3D variants are gone); Pin point to object absorbs Set point to object and Set point to image point; Pin points to objects absorbs Set points from objects; Set point size replaces the width, height, texture and rest-length actions; Set line between objects, Clear points, Fit object to line, the per-setting appearance and performance actions, Point exists, Is culled and the derived state expressions were removed.
- **Changed:** - Point width parameters are now heights (full line thickness, like the object height) instead of half-widths.
- **Fixed:** - Host set-up no longer depends on the _postCreate hook (falls back to the first tick), an action run before the first tick is no longer overwritten by the default ribbon, and mesh API errors are reported to the console once instead of being swallowed.
- **Fixed:** - Tiled Background textures no longer stretch their last pixel column past the object's own repeat count.

**2.0.0.0**
- **Added:** - Enabled property, Set enabled action and Is enabled condition.
- **Added:** - Co-ordinate space and Distortion resolution are now editor properties.
- **Added:** - Auto-fit to line property, Set auto-fit to line action and Fit object to line action.
- **Added:** - Joins property and Set joins action: Simple, Miter (with limit and bevel fallback), Bevel and Round corners. End caps are None, Square or Round. EndCapStyle and JoinStyle expressions.
- **Added:** - 3D, following the Trail Renderer approach: Cross-section points property and action (3 or more points draw a tube), Add point with Z elevation, Set point to image point (including 3D shape faces), Set point to 3D model node, Set billboard camera (automatic or manual) and Set up vector actions, CrossSection expression. Absolute co-ordinate space now uses layout Z elevation; object-following actions read Z elevation and convert into the current space. Auto-fit also lowers the object's Z elevation to the lowest point and clears 3D rotation.
- **Added:** - Compare point count and Compare co-ordinate space conditions.
- **Changed:** - Reworked from a world plugin into a behavior for Sprite and Tiled Background objects.
- **Changed:** - The line is drawn by driving the object's mesh distortion, so the object's image, animation frames, opacity, color, blend mode, effects and collisions apply directly.
- **Changed:** - Addon id changed to salmanshh_line_renderer (installs alongside the old plugin; projects must be re-wired).
- **Changed:** - Removed editor preview, blend mode, sampling mode, debug points and per-point color features: the object provides appearance, and Construct meshes have no per-vertex color.
- **Changed:** - Removed the Texture tile length and Default width properties and actions: texture mapping and tile density come from the object (Tiled Backgrounds tile at their image size times Image scale, Sprites stretch their frame), and path actions use half the object's height as the line width.
- **Changed:** - ACE names, display text, parameters and property text follow Construct conventions (Set {my} ... to, Z elevation, co-ordinates, texture scrolling, off-screen culling, Compare point count).
- **Changed:** - Migration: replace each Line Renderer 2D object with a Tiled Background (or Sprite) carrying the Line Renderer behavior, paint the line image on that object, and re-add the point and path actions under the behavior.
- **Fixed:** - The stroke sampler and Smooth line skipped every interior point, so lines cut corners; every point is now passed through exactly.
- **Fixed:** - Removed the leftover sample ACEs that shipped in the plugin build.

**1.1.0.0**

**1.0.0.1**

**1.0.0.0**

**0.0.0.0**
- **Added:** Initial release.
