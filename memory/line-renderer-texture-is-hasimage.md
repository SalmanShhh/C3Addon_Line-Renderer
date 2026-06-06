---
name: line-renderer-texture-is-hasimage
description: line_renderer addon uses HasImage (editable object image) for its texture, not a PROJECTFILE property
metadata:
  type: project
---

The Line Renderer 2D addon's stroke texture is the **object's editable image** (`HasImage: true`, edited in C3 like a Sprite frame via double-click), **not** a project-file property.

**Why:** User wanted the texture editable in-editor like a Sprite, plus tiling and effects. The old `strokeTexture` PROJECTFILE property was removed.

**How to apply:** Texture comes from `getImageInfo()`, not a path. `config.caw.js` info.Set has `HasImage/IsTiled/SupportsColor/SupportsEffects/MustPreDraw: true`. Removing `strokeTexture` shifted every runtime `_getInitProperties()` index down by one — that positional mapping is documented in the `src/runtime/instance.js` constructor; keep it in sync if properties change. Tiling relies on `IsTiled` giving a non-spritesheeted texture with repeat wrap, so UVs can exceed 1 (no manual UV wrapping). Removing the property is a breaking change for any pre-existing .c3p projects.

See [[c3-renderer-casing-and-drawmesh]].
