<img src="./src/icon.svg" width="100" /><br>
# Line Renderer
<i>Draw a Sprite or Tiled Background as a line, rope or beam along a path of points using mesh distortion, in 2D or 3D.</i> <br>
### Version 2.0.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/releases/download/salmanshh_line_renderer-2.0.0.0.c3addon/salmanshh_line_renderer-2.0.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/releases) </sub> <br>

#### What's New in 2.0.0.0
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

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Initial point count | The number of points the line starts with. They are spread across the object so it initially looks unchanged. | integer |
| Co-ordinate space | Absolute uses layout co-ordinates. Relative uses co-ordinates relative to the object's position, angle and size, so the line moves with the object. | combo |
| Texture scroll speed | How fast the image scrolls along the line, in pixels per second (Tiled Background only). | float |
| End caps | The shape of the start and end of the line. None cuts off at the end point; Square and Round extend by half the thickness. | combo |
| Facing | How the width of the line is oriented in 3D. Flat stays in the layout plane, Billboard faces the camera, Up vector follows the up vector. | combo |
| Distortion amplitude | The maximum offset of the distortion wave, in pixels. 0 disables distortion. | float |
| Distortion frequency | The frequency of the distortion wave along the line. | float |
| Distortion speed | How fast the distortion wave moves along the line. | float |
| Distortion axis | The direction the distortion wave moves points in. | combo |
| Distortion resolution | The number of mesh subdivisions per segment. Increase for smoother distortion on long segments. | integer |
| Auto-fit to line | Move and resize the object to cover the line after each update (absolute co-ordinate space only). Keeps collisions and on-screen checks accurate for long lines. | check |
| Joins | How corners between segments are drawn. Simple is cheapest but thins at corners, Miter is sharp, Bevel is chipped, Round is rounded. | combo |
| Cross-section points | The number of points around the line. 2 draws a flat ribbon; 3 or more draws a 3D tube (joins become Simple). | integer |
| Enabled | Whether the behavior is initially enabled. | check |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Set billboard camera | Set the camera position used by Billboard facing, either from the 3D camera automatically or from a position. | Mode             *(combo)* <br>X             *(number)* <br>Y             *(number)* <br>Z elevation             *(number)* <br> |
| Set cross-section points | Set the number of points around the line: 2 draws a flat ribbon, 3 or more draws a 3D tube. | Points             *(number)* <br> |
| Set end caps | Set the shape of the start and end of the line. | End caps             *(combo)* <br> |
| Set joins | Set how corners between segments are drawn. | Joins             *(combo)* <br> |
| Set facing | Set how the width of the line is oriented in 3D. | Facing             *(combo)* <br> |
| Set up vector | Set the up direction used by Up vector facing. The default (0, 0, 1) points up in Z elevation. | X             *(number)* <br>Y             *(number)* <br>Z             *(number)* <br> |
| Set texture scroll speed | Set how fast the image scrolls along the line (Tiled Background only). | Speed             *(number)* <br> |
| Fit object to line | Move and resize the object once so that it covers the line (absolute co-ordinate space only). |  |
| Set auto-fit to line | Enable or disable moving and resizing the object to cover the line after each update (absolute co-ordinate space only). | Enabled             *(boolean)* <br> |
| Set co-ordinate space | Set whether points are in layout co-ordinates (absolute) or relative to the object (relative). | Co-ordinate space             *(combo)* <br> |
| Set distortion amplitude | Set the maximum offset of the distortion wave. 0 disables distortion. | Amplitude             *(number)* <br> |
| Set distortion axis | Set the direction the distortion wave moves points in. | Axis             *(combo)* <br> |
| Set distortion frequency | Set the frequency of the distortion wave along the line. | Frequency             *(number)* <br> |
| Set distortion | Set the amplitude, frequency and speed of the distortion wave. | Amplitude             *(number)* <br>Frequency             *(number)* <br>Speed             *(number)* <br> |
| Set distortion speed | Set how fast the distortion wave moves along the line. | Speed             *(number)* <br> |
| Set points from objects | Replace all points with the positions of the picked instances of an object, one point per instance. | Object             *(object)* <br> |
| Set point to image point | Set a point to the position of an image point of the first picked instance, including its Z elevation. Choose a face for 3D shape face image points. | Index             *(number)* <br>Object             *(object)* <br>Face             *(combo)* <br>Image point             *(any)* <br> |
| Set point to 3D model node | Set a point to the position of a mesh or bone node of the first picked 3D model instance. | Index             *(number)* <br>Object             *(object)* <br>Node type             *(combo)* <br>Node name             *(string)* <br> |
| Set point to object | Set a point to the position and Z elevation of the first picked instance of an object. | Index             *(number)* <br>Object             *(object)* <br> |
| Set arc | Replace all points with an arc around a position. | Center X             *(number)* <br>Center Y             *(number)* <br>Radius             *(number)* <br>Start angle             *(number)* <br>End angle             *(number)* <br>Segments             *(number)* <br> |
| Set bezier curve | Replace all points with a cubic bezier curve. | Start X             *(number)* <br>Start Y             *(number)* <br>Control 1 X             *(number)* <br>Control 1 Y             *(number)* <br>Control 2 X             *(number)* <br>Control 2 Y             *(number)* <br>End X             *(number)* <br>End Y             *(number)* <br>Segments             *(number)* <br> |
| Set line between objects | Replace all points with a straight line between the first picked instances of two objects. | From             *(object)* <br>To             *(object)* <br> |
| Set line | Replace all points with a straight line between two positions. | Start X             *(number)* <br>Start Y             *(number)* <br>End X             *(number)* <br>End Y             *(number)* <br> |
| Set line with Z elevation | Replace all points with a straight line between two positions with Z elevations. | Start X             *(number)* <br>Start Y             *(number)* <br>Start Z elevation             *(number)* <br>End X             *(number)* <br>End Y             *(number)* <br>End Z elevation             *(number)* <br> |
| Smooth line | Replace the points with a smooth curve passing through them. | Subdivisions             *(number)* <br> |
| Set distortion resolution | Set the number of mesh subdivisions per segment used for distortion. | Subdivisions             *(number)* <br> |
| Set off-screen culling | Enable or disable skipping line updates while the line is off-screen. | Enabled             *(boolean)* <br> |
| Set maximum drawn points | Limit how many points are used to draw the line. 0 uses all points. | Maximum points             *(number)* <br> |
| Set width of all points | Set the width of the line at every point. | Width             *(number)* <br> |
| Set point | Set the position and width of a point. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Width             *(number)* <br> |
| Set point width | Set the width of the line at a point. | Index             *(number)* <br>Width             *(number)* <br> |
| Set point position | Set the position of a point. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br> |
| Set point position with Z elevation | Set the position and Z elevation of a point. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Z elevation             *(number)* <br> |
| Set point Z elevation | Set the Z elevation of a point. | Index             *(number)* <br>Z elevation             *(number)* <br> |
| Add point | Add a point to the end of the line. | X             *(number)* <br>Y             *(number)* <br>Width             *(number)* <br> |
| Add point with Z elevation | Add a point with a Z elevation to the end of the line. | X             *(number)* <br>Y             *(number)* <br>Z elevation             *(number)* <br>Width             *(number)* <br> |
| Clear points | Remove all points, leaving two points at the origin. |  |
| Insert point | Insert a point at an index, moving later points up by one. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Width             *(number)* <br> |
| Remove point | Remove the point at an index. A line always keeps at least two points. | Index             *(number)* <br> |
| Set enabled | Enable or disable the line. While disabled the object is drawn normally. | State             *(combo)* <br> |
| Set point count | Set the number of points in the line, adding points at (0, 0) or removing points from the end. | Count             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| On line updated | Triggered after the line's mesh has been updated. |  |
| On point count changed | Triggered when a point is added or removed. |  |
| Compare point count | Compare the number of points in the line. | Comparison *(cmp)* <br>Count *(number)* <br> |
| Compare co-ordinate space | True if the line uses the given co-ordinate space. | Co-ordinate space *(combo)* <br> |
| Is culled off-screen | True if the last update was skipped because the line was off-screen. |  |
| Is distorting | True if the distortion amplitude is greater than 0. |  |
| Is enabled | True if the line is currently enabled. |  |
| Is limiting drawn points | True if the maximum drawn points setting is reducing the number of points drawn. |  |
| Point exists | True if a point with the given index exists. | Index *(number)* <br> |
| Is texture scrolling | True if the texture scroll speed is not 0. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| CoordSpace | The co-ordinate space: "absolute" or "relative". | string |  | 
| CrossSection | The number of cross-section points (2 for a ribbon). | number |  | 
| DistortAmplitude | The distortion amplitude, in pixels. | number |  | 
| DistortFrequency | The distortion frequency. | number |  | 
| DistortResolution | The number of mesh subdivisions per segment. | number |  | 
| DistortSpeed | The distortion speed. | number |  | 
| EndCapStyle | The end cap style: "round", "flat" or "square". | string |  | 
| GetPointWidth | The width (half thickness) of the line at a point. | number | Index *(number)* <br> | 
| GetPointX | The layout X co-ordinate of a point. | number | Index *(number)* <br> | 
| GetPointY | The layout Y co-ordinate of a point. | number | Index *(number)* <br> | 
| GetPointZ | The layout Z elevation of a point. | number | Index *(number)* <br> | 
| JoinStyle | The join style: "simple", "miter", "bevel" or "round". | string |  | 
| LineLength | The length of the line, in pixels. | number |  | 
| PointCount | The number of points in the line. | number |  | 
| RenderedPointCount | The number of points used to draw the line after the maximum drawn points limit. | number |  | 
| RenderLOD | The maximum drawn points setting, or 0 for all points. | number |  | 
| UVScrollOffset | How far the texture has scrolled along the line, in pixels. | number |  | 
| UVScrollSpeed | The texture scroll speed, in pixels per second. | number |  | 
| VertexCount | The number of mesh points used to draw the line. | number |  | 


---
## Changelog

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
