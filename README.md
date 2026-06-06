<img src="./src/icon.svg" width="100" /><br>
# Line Renderer 2D
<i>Procedural mesh-distorted line renderer for ropes, beams, trails, and other dynamic strokes.</i> <br>
### Version 1.1.0.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/releases/download/salmanshh_line_renderer2D-1.1.0.0.c3addon/salmanshh_line_renderer2D-1.1.0.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/C3Addon_Line-Renderer-2D/releases) </sub> <br>

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
| Initial point count | Number of control points allocated when the instance is created. | integer |
| Texture tile length | World-space pixels per full texture repeat along the stroke. | float |
| UV scroll speed | Pixels per second the texture scrolls from start to end. | float |
| Default width | Initial width assigned to control points. | float |
| Distort amplitude | Maximum pixel offset applied by the distortion pass. | float |
| Distort frequency | Spatial frequency of the distortion wave. | float |
| Distort speed | Speed multiplier for distortion phase advance. | float |
| Distort axis | Which axis receives the distortion offset. | combo |
| End cap style | Shape used at the start and end of the stroke. | combo |
| Blend mode | Blend mode used when drawing the generated mesh. | combo |
| Sampling mode | Texture sampling mode used for the stroke texture. | combo |
| Debug points | Draw control-point markers in the editor and at runtime. | check |
| Editor preview | Controls how the line preview renders in the layout editor. | combo |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Set blend mode | Set the stroke blend mode. | Mode             *(combo)* <br> |
| Set end cap style | Set the start and end cap style. | Style             *(combo)* <br> |
| Set opacity | Set master opacity of the stroke. | Opacity             *(number)* <br> |
| Set texture tile length | Set the world-space pixels per texture repeat. | Length             *(number)* <br> |
| Set UV scroll speed | Set texture scroll speed. | Speed             *(number)* <br> |
| Set coordinate space | Choose absolute or relative point coordinates. | Space             *(combo)* <br> |
| Set distort amplitude | Set distortion amplitude. | Amplitude             *(number)* <br> |
| Set distort axis | Set which axis distortion offsets apply to. | Axis             *(combo)* <br> |
| Set distort frequency | Set distortion frequency. | Frequency             *(number)* <br> |
| Set distortion | Set all distortion parameters. | Amplitude             *(number)* <br>Frequency             *(number)* <br>Speed             *(number)* <br> |
| Set distort speed | Set distortion speed. | Speed             *(number)* <br> |
| Set points from objects | Rebuild the point list from picked instances. | Object             *(object)* <br> |
| Set point to object | Set a point position from the first picked instance. | Index             *(number)* <br>Object             *(object)* <br> |
| Build arc | Build an arc into control points. | Center X             *(number)* <br>Center Y             *(number)* <br>Radius             *(number)* <br>Start angle             *(number)* <br>End angle             *(number)* <br>Segments             *(number)* <br> |
| Build bezier | Sample a cubic bezier into control points. | X1             *(number)* <br>Y1             *(number)* <br>C1 X             *(number)* <br>C1 Y             *(number)* <br>C2 X             *(number)* <br>C2 Y             *(number)* <br>X2             *(number)* <br>Y2             *(number)* <br>Segments             *(number)* <br> |
| Connect objects | Build a two-point line between picked objects. | From             *(object)* <br>To             *(object)* <br> |
| Set line | Replace the point list with a straight line. | X1             *(number)* <br>Y1             *(number)* <br>X2             *(number)* <br>Y2             *(number)* <br> |
| Smooth path | Replace the path with a Catmull-Rom spline. | Subdivisions             *(number)* <br> |
| Set distort resolution | Set the number of vertex pairs per segment. | Subdivisions             *(number)* <br> |
| Set frustum culling | Enable or disable off-screen culling. | Enabled             *(boolean)* <br> |
| Set render LOD | Cap the point count used for the rendered mesh. | Max points             *(number)* <br> |
| Set all colors | Set every point tint. | Red             *(number)* <br>Green             *(number)* <br>Blue             *(number)* <br>Opacity             *(number)* <br> |
| Set all widths | Set every point width. | Width             *(number)* <br> |
| Set point | Set the position and width of a point. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Width             *(number)* <br> |
| Set point color | Set the tint of a point. | Index             *(number)* <br>Red             *(number)* <br>Green             *(number)* <br>Blue             *(number)* <br>Opacity             *(number)* <br> |
| Set point width | Set the width of a point. | Index             *(number)* <br>Width             *(number)* <br> |
| Set point position | Set the position of a point. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br> |
| Add point | Append one control point. | X             *(number)* <br>Y             *(number)* <br>Width             *(number)* <br> |
| Clear points | Reset to two default control points. |  |
| Insert point | Insert a control point at an index. | Index             *(number)* <br>X             *(number)* <br>Y             *(number)* <br>Width             *(number)* <br> |
| Remove point | Remove a control point. | Index             *(number)* <br> |
| Set point count | Resize the internal control-point list. | Count             *(number)* <br> |
| Sample Action | This is a sample action | Param1             *(string)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| On mesh rebuilt | Triggered when the mesh is rebuilt this tick. |  |
| On point count changed | Triggered when the point count changes. |  |
| Has minimum points | True if the line has enough points. | Minimum *(number)* <br> |
| Is culled | True if culling skipped the line on the last tick. |  |
| Is distortion active | True if distortion amplitude is greater than zero. |  |
| Is LOD active | True if the render LOD cap is reducing the rendered point count. |  |
| Is point index valid | True if the index points to an existing control point. | Index *(number)* <br> |
| Is relative space | True if points are interpreted relative to the instance transform. |  |
| Is texture assigned | True if a stroke texture is available. |  |
| Is UV scrolling | True if UV scroll speed is non-zero. |  |
| Sample Condition | This is a sample condition |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| CoordSpace | Current coordinate space. | string |  | 
| DistortAmplitude | Current distortion amplitude. | number |  | 
| DistortFrequency | Current distortion frequency. | number |  | 
| DistortResolution | Current distortion subdivision count. | number |  | 
| DistortSpeed | Current distortion speed. | number |  | 
| GetPointB | Blue channel of a control point. | number | Index *(number)* <br> | 
| GetPointG | Green channel of a control point. | number | Index *(number)* <br> | 
| GetPointOpacity | Opacity of a control point. | number | Index *(number)* <br> | 
| GetPointR | Red channel of a control point. | number | Index *(number)* <br> | 
| GetPointWidth | Width of a control point. | number | Index *(number)* <br> | 
| GetPointX | World X of a control point. | number | Index *(number)* <br> | 
| GetPointY | World Y of a control point. | number | Index *(number)* <br> | 
| LineLength | Length of the last built polyline. | number |  | 
| PointCount | Total number of control points. | number |  | 
| RenderedPointCount | Rendered point count used in the last mesh build. | number |  | 
| RenderLOD | Current render LOD cap. | number |  | 
| TextureTileLength | Current texture tile length. | number |  | 
| UVScrollOffset | Accumulated UV scroll offset. | number |  | 
| UVScrollSpeed | Current UV scroll speed. | number |  | 
| VertexCount | Vertex count of the last built mesh. | number |  | 
| SampleExpression | This is a sample expression | string |  | 


---
## Changelog

**1.1.0.0**

**1.0.0.1**

**1.0.0.0**

**0.0.0.0**
- **Added:** Initial release.
