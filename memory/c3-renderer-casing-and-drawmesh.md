---
name: c3-renderer-casing-and-drawmesh
description: C3 SDK gotcha — runtime vs editor renderer method casing, drawMesh array formats, and editor instance positioning
metadata:
  type: reference
---

Non-obvious C3 SDK v2 facts that bit this addon (line_renderer) and recur in any mesh-drawing plugin:

- **Renderer method casing differs by side.** Runtime `IRenderer` (in `src/runtime/instance.js` `_draw(renderer)`) uses **camelCase**: `setAlphaBlendMode`, `setTextureFillMode`, `setTexture`, `setColorFillMode`, `setColorRgba`, `drawMesh`, `rect2`. Editor `IWebGLRenderer` (in `src/editor/instance.js` `Draw(iRenderer)`) uses **PascalCase**: `SetAlphaBlendMode`, `SetTexture`, `DrawMesh`, `Rect2`, `Line`. Calling the wrong casing silently no-ops → nothing renders. The original code used PascalCase in the runtime `_draw`, so it rendered nothing at runtime.
- **`drawMesh(posArr, uvArr, indexArr, colorArr)` formats:** positions are **3 components per vertex** `[x,y,z,...]` (use z=0 for 2D), indices are **`Uint16Array`** (max 64k verts), per-vertex colors are **premultiplied** RGBA. The shared mesh builder (`src/shared/meshstrokeShared.js`) now emits these.
- **`IDrawParams` has no `GetLayoutRect()`** (only `GetDt()`, `GetLayoutView()`). To position an editor world-plugin preview at the instance, use `this._inst.GetQuad()` (SDK.Quad, layout coords, includes scene-graph parent transform) — see `createPreviewPointsFromQuad`. The old code's `iDrawParams.GetLayoutRect()` returned undefined → preview fell back to origin (0,0).
- **HasImage texture path (runtime):** load via `renderer.loadTextureForImageInfo(imageInfo, {sampling})` in `_loadTextures(renderer)`, release in `_releaseTextures(renderer)`, fetch sync in `_draw` via `renderer.getTextureForImageInfo(imageInfo)`. `imageInfo` comes from `this.objectType.getImageInfo()` (name not documented in the skills file; code uses a fallback chain).
- **Effects on a non-sprite mesh** require `SupportsEffects: true` + `MustPreDraw: true`. With MustPreDraw, Construct composites `_draw` output using the instance's native `this.blendMode`, so draw geometry with `setAlphaBlendMode()` only — don't set a non-normal blend mode in `_draw` or it double-applies.

See [[line-renderer-texture-is-hasimage]].
