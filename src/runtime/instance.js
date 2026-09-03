import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";
import {
  COORD_SPACE_KEYS,
  DISTORT_AXIS_KEYS,
  END_CAP_KEYS,
  JOIN_STYLE_KEYS,
  RIBBON_FACING_KEYS,
  buildStrokeColumns,
  clamp01,
  clonePoint,
  columnVertex,
  rowsForCrossSection,
  createBoxSpanningPoints,
  createInitialPoints,
  estimateColumnCount,
  getComboKey,
  makePoint,
  toCount,
  toFiniteNumber,
} from "../shared/meshstrokeShared.js";

// Hard cap on host mesh vertices (columns x rows) so a runaway point count or
// a dense tube cannot allocate an enormous mesh. Longer paths are LOD-reduced.
const MAX_MESH_VERTICES = 2048;
const MAX_CROSS_SECTION = 32;

// Non-zero signed dimension, used when dividing by the host's width/height.
function safeDimension(value, fallback = 1) {
  const number = toFiniteNumber(value, fallback);
  if (Math.abs(number) < 1e-4) {
    return number < 0 ? -1e-4 : 1e-4;
  }
  return number;
}

// The behavior renders the line by turning its host object (a Sprite or Tiled
// Background) into an N x 2 mesh: one column per stroke sample, row 0 = left
// edge, row 1 = right edge. Construct keeps drawing the host as usual, so the
// host's image, animation frame, opacity, color, blend mode, effects, Z order and
// collision polygon all apply to the line.
//
// Pipeline each rebuild: control points -> layout-space columns (shared
// builder) -> normalised host-box coordinates -> setMeshPoint().
export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();

      // Property index order must match config.caw.js properties[].
      const properties = this._getInitProperties();
      this._initialPointCount = toCount(properties?.[0], 2);
      this._coordSpace = getComboKey(properties?.[1], COORD_SPACE_KEYS, COORD_SPACE_KEYS[1]);
      this._uvScrollSpeed = toFiniteNumber(properties?.[2], 0);
      this._endCapStyle = getComboKey(properties?.[3], END_CAP_KEYS, END_CAP_KEYS[0]);
      this._ribbonFacing = getComboKey(properties?.[4], RIBBON_FACING_KEYS, RIBBON_FACING_KEYS[0]);
      this._distortAmplitude = Math.max(0, toFiniteNumber(properties?.[5], 0));
      this._distortFrequency = Math.max(0, toFiniteNumber(properties?.[6], 1));
      this._distortSpeed = toFiniteNumber(properties?.[7], 1);
      this._distortAxis = getComboKey(properties?.[8], DISTORT_AXIS_KEYS, DISTORT_AXIS_KEYS[2]);
      this._distortResolution = Math.max(1, Math.floor(toFiniteNumber(properties?.[9], 1)));
      this._autoFit = !!properties?.[10];
      this._joinStyle = getComboKey(properties?.[11], JOIN_STYLE_KEYS, JOIN_STYLE_KEYS[3]);
      this._crossSection = this._clampCrossSection(properties?.[12]);
      // "Enabled" is always the last property, like the built-in behaviors.
      this._enabled = properties?.[13] === undefined ? true : !!properties[13];

      // Derived from the host in _postCreate(): the object's height is the line
      // thickness, so path-building actions use half of it as the point width.
      this._defaultWidth = 16;

      this.events = {};

      // this.instance is null in the constructor. Seed a placeholder point list
      // so ACEs that run before _postCreate() have something valid to edit; the
      // box-spanning default is created once the host is ready.
      this._points = createInitialPoints(this._initialPointCount, this._defaultWidth);
      this._relativeBaseWidth = 1;
      this._relativeBaseHeight = 1;
      this._hostReady = false;

      this._built = null;
      this._uvScrollOffset = 0;
      this._distortPhase = 0;
      this._meshDirty = true;
      this._meshRebuildCount = 0;
      this._lastTickRebuilt = false;
      this._lastLineLength = 0;
      this._lastVertexCount = 0;
      this._lastRenderedPointCount = this._points.length;
      this._renderLOD = 0;
      this._frustumCullingEnabled = false;
      this._isCulled = false;
      this._lastTransformSig = null;
      this._lastUvMode = "";
      // 3D camera object class (for billboard facing). undefined = not yet looked
      // up; null = looked up and absent. Resolved lazily so a camera created
      // after this instance is still found on the next attempt.
      this._camera = undefined;
      // Manual camera position [x, y, z] set from events, or null for automatic.
      this._manualCamera = null;
      // World up vector used by the "up_vector" ribbon facing.
      this._upVector = { x: 0, y: 0, z: 1 };
      // Size of the mesh currently created on the host (0 columns = none).
      this._hostMeshColumns = 0;
      this._hostMeshRows = 0;
      this._meshApiWarned = false;

      // Rebuild after the event sheet so actions run this frame are reflected in
      // the same frame's draw.
      this._setTicking2(true);
    }

    _postCreate() {
      const inst = this.instance;
      if (!inst) {
        return;
      }

      // Capture the placement size as the base for relative-space scaling, then
      // seed a ribbon spanning the host's box so the object looks unchanged
      // (like a plain Tiled Background) until points are edited.
      this._relativeBaseWidth = safeDimension(inst.width, 1);
      this._relativeBaseHeight = safeDimension(inst.height, 1);
      this._defaultWidth = Math.abs(this._relativeBaseHeight) * 0.5;
      this._points = createBoxSpanningPoints(
        this._initialPointCount,
        inst.width,
        inst.height,
        inst.originX,
        inst.originY,
        this._defaultWidth
      );
      this._lastRenderedPointCount = this._points.length;
      this._hostReady = true;
      this._markMeshDirty();
    }

    _trigger(method) {
      this.dispatch(method);
      super._trigger(self.C3[AddonTypeMap[addonType]][id].Cnds[method]);
    }

    on(tag, callback, options) {
      if (!this.events[tag]) {
        this.events[tag] = [];
      }
      this.events[tag].push({ callback, options });
    }

    off(tag, callback) {
      if (this.events[tag]) {
        this.events[tag] = this.events[tag].filter(
          (event) => event.callback !== callback
        );
      }
    }

    dispatch(tag) {
      if (this.events[tag]) {
        this.events[tag].forEach((event) => {
          if (event.options && event.options.params) {
            const fn = self.C3[AddonTypeMap[addonType]][id].Cnds[tag];
            if (fn && !fn.call(this, ...event.options.params)) {
              return;
            }
          }
          event.callback();
          if (event.options && event.options.once) {
            this.off(tag, event.callback);
          }
        });
      }
    }

    // ---------------------------------------------------------------------
    // Camera (billboard facing)
    // ---------------------------------------------------------------------

    // Resolve the project's 3D camera object class. C3 has no per-instance
    // camera accessor, so we look for the 3D Camera object: first by its usual
    // names, then any object class exposing getCameraPosition(). Without one,
    // billboard mode falls back to the default (top-down) view direction, which
    // renders the same as flat facing in 2D.
    _getCamera() {
      if (this._camera !== undefined) {
        return this._camera;
      }

      this._camera = null;
      try {
        const objects = this.runtime?.objects ?? {};
        const isCamera = (candidate) =>
          !!candidate && typeof candidate.getCameraPosition === "function";
        const named = objects["3DCamera"] ?? objects.Camera3D ?? null;
        if (isCamera(named)) {
          this._camera = named;
        } else {
          for (const candidate of Object.values(objects)) {
            if (isCamera(candidate)) {
              this._camera = candidate;
              break;
            }
          }
        }
      } catch (_error) {
        this._camera = null;
      }
      return this._camera;
    }

    _getCameraPosition() {
      if (this._manualCamera) {
        return this._manualCamera;
      }
      const camera = this._getCamera();
      if (!camera) {
        return null;
      }
      try {
        const position = camera.getCameraPosition?.();
        return Array.isArray(position) && position.length >= 3 ? position : null;
      } catch (_error) {
        return null;
      }
    }

    // mode: 0/"automatic" = read the 3D Camera object; otherwise use x, y, z.
    _setBillboardCamera(mode, x, y, z) {
      const automatic = mode === 0 || mode === "automatic";
      this._manualCamera = automatic
        ? null
        : [toFiniteNumber(x, 0), toFiniteNumber(y, 0), toFiniteNumber(z, 0)];
      if (automatic) {
        this._camera = undefined; // re-resolve in case the camera object was created later
      }
      this._markMeshDirty();
    }

    _setUpVector(x, y, z) {
      const vx = toFiniteNumber(x, 0);
      const vy = toFiniteNumber(y, 0);
      const vz = toFiniteNumber(z, 0);
      const length = Math.hypot(vx, vy, vz);
      this._upVector =
        length > 1e-6 ? { x: vx / length, y: vy / length, z: vz / length } : { x: 0, y: 0, z: 1 };
      this._markMeshDirty();
    }

    // Z origin for point coordinates: absolute space uses layout Z directly,
    // relative space treats point Z as an offset from the host's elevation.
    _getPointZBase() {
      return this._coordSpace === "relative" ? toFiniteNumber(this.instance?.totalZ, 0) : 0;
    }

    // Convert a layout-space position into point space for the current
    // coordinate mode, so object-following actions work in both spaces.
    _layoutToPointSpace(x, y, z) {
      const lx = toFiniteNumber(x, 0);
      const ly = toFiniteNumber(y, 0);
      const lz = toFiniteNumber(z, 0);
      if (this._coordSpace !== "relative") {
        return { x: lx, y: ly, z: lz };
      }

      const transform = this._getRelativeTransform();
      const dx = lx - transform.x;
      const dy = ly - transform.y;
      const cosAngle = Math.cos(transform.angle);
      const sinAngle = Math.sin(transform.angle);
      const localX = dx * cosAngle + dy * sinAngle;
      const localY = -dx * sinAngle + dy * cosAngle;
      return {
        x: localX / safeDimension(transform.scaleX, 1),
        y: localY / safeDimension(transform.scaleY, 1),
        z: lz - toFiniteNumber(this.instance?.totalZ, 0),
      };
    }

    // Point-space position of another world instance (its origin and total Z).
    _instanceToPointSpace(target) {
      return this._layoutToPointSpace(
        target?.x,
        target?.y,
        target?.totalZ ?? target?.totalZElevation ?? target?.z ?? target?.zElevation ?? 0
      );
    }

    _getCameraSignature() {
      const position = this._getCameraPosition();
      return position ? `${position[0]},${position[1]},${position[2]}` : "";
    }

    _isBillboard() {
      return this._ribbonFacing === "billboard";
    }

    // ---------------------------------------------------------------------
    // Setters used by ACEs
    // ---------------------------------------------------------------------

    _setRibbonFacing(facing) {
      const next = getComboKey(facing, RIBBON_FACING_KEYS, this._ribbonFacing);
      if (next === this._ribbonFacing) {
        return;
      }
      this._ribbonFacing = next;
      this._markMeshDirty();
    }

    _setEnabled(enabled) {
      const next = !!enabled;
      if (next === this._enabled) {
        return;
      }
      this._enabled = next;
      if (next) {
        this._markMeshDirty();
      } else {
        // Hand the object back to Construct: it renders its plain image again.
        this._releaseHostMesh();
      }
    }

    _markMeshDirty() {
      this._meshDirty = true;
    }

    // ---------------------------------------------------------------------
    // Per-frame update
    // ---------------------------------------------------------------------

    _getDt() {
      const dt = toFiniteNumber(this.instance?.dt ?? this.runtime?.dt, 0);
      return Math.max(0, dt);
    }

    // Everything outside the point list that the mesh depends on. In relative
    // space the normalised mesh coordinates are invariant to the host's position
    // and angle (they move the mesh for free), so only size (non-uniform width
    // scaling) matters there. Absolute space and billboard facing depend on the
    // full transform / camera.
    _getTransformSignature() {
      const inst = this.instance;
      const billboard = this._isBillboard();
      const camSig = billboard ? this._getCameraSignature() : "";
      if (this._coordSpace === "relative" && !billboard) {
        return `${inst.width},${inst.height}`;
      }
      return `${inst.x},${inst.y},${inst.width},${inst.height},${inst.angle},${toFiniteNumber(inst.totalZ, 0)}|${camSig}`;
    }

    _tick2() {
      if (!this._enabled || !this._hostReady) {
        return;
      }
      const inst = this.instance;
      if (!inst) {
        return;
      }

      const dt = this._getDt();
      const distortionActive = this._distortAmplitude > 0;
      const uvActive = this._uvScrollSpeed !== 0;

      this._lastTickRebuilt = false;

      const sig = this._getTransformSignature();
      if (sig !== this._lastTransformSig) {
        this._lastTransformSig = sig;
        this._meshDirty = true;
      }

      if (uvActive) {
        this._uvScrollOffset += this._uvScrollSpeed * dt;
      }

      if (distortionActive) {
        this._distortPhase += this._distortSpeed * dt;
      }

      this._isCulled = this._frustumCullingEnabled && this._shouldCull();
      if (this._isCulled) {
        return;
      }

      if (!this._meshDirty && !distortionActive && !uvActive) {
        return;
      }

      this._rebuildMesh();
    }

    _getRelativeTransform() {
      const inst = this.instance;
      return {
        x: toFiniteNumber(inst?.x, 0),
        y: toFiniteNumber(inst?.y, 0),
        angle: toFiniteNumber(inst?.angle, 0),
        scaleX: safeDimension(inst?.width, this._relativeBaseWidth) / this._relativeBaseWidth,
        scaleY: safeDimension(inst?.height, this._relativeBaseHeight) / this._relativeBaseHeight,
      };
    }

    // Effective render LOD: the user cap, further limited so the resulting mesh
    // stays under MAX_MESH_COLUMNS.
    _clampCrossSection(value) {
      return Math.max(2, Math.min(MAX_CROSS_SECTION, Math.floor(toFiniteNumber(value, 2))));
    }

    _isTube() {
      return this._crossSection > 2;
    }

    // Join style actually used: tubes need a ring centre, so they always use
    // the simple bisector join.
    _getEffectiveJoinStyle() {
      return this._isTube() ? "simple" : this._joinStyle;
    }

    _getMaxColumns() {
      return Math.max(2, Math.floor(MAX_MESH_VERTICES / rowsForCrossSection(this._crossSection)));
    }

    _getEffectiveRenderLod() {
      const resolution = Math.max(1, Math.floor(this._distortResolution));
      const userLod = this._renderLOD > 0 ? this._renderLOD : this._points.length;
      const maxColumns = this._getMaxColumns();
      let capped = Math.max(2, Math.min(userLod, this._points.length));
      // Columns grow linearly with the point count, so step down until the
      // worst-case column estimate fits the budget.
      const columnsFor = (n) =>
        estimateColumnCount(n, resolution, this._endCapStyle, this._getEffectiveJoinStyle());
      if (columnsFor(capped) > maxColumns) {
        const perPoint = columnsFor(3) - columnsFor(2);
        capped = Math.max(2, Math.floor((maxColumns - columnsFor(2)) / Math.max(1, perPoint)) + 2);
        while (capped > 2 && columnsFor(capped) > maxColumns) {
          capped -= 1;
        }
      }
      return capped < this._points.length ? capped : 0;
    }

    _setCrossSection(points) {
      const next = this._clampCrossSection(points);
      if (next === this._crossSection) {
        return;
      }
      this._crossSection = next;
      this._markMeshDirty();
    }

    // Move one point to a layout-space position (converted to point space).
    _setPointToLayout(index, x, y, z) {
      const pointIndex = this._coercePointIndex(index);
      if (!this._isValidPointIndex(pointIndex)) {
        return false;
      }
      const position = this._layoutToPointSpace(x, y, z);
      const point = this._points[pointIndex];
      point.x = position.x;
      point.y = position.y;
      point.z = position.z;
      this._markMeshDirty();
      return true;
    }

    // Layout-space [x, y, z] of a world instance's origin, image point, 3D Shape
    // face image point or 3D Model node, feature-detecting the r496+ APIs and
    // falling back to the instance position.
    _getAttachPosition(target, opts = {}) {
      const fallback = () => [
        toFiniteNumber(target?.x, 0),
        toFiniteNumber(target?.y, 0),
        toFiniteNumber(target?.totalZ ?? target?.totalZElevation ?? target?.z ?? 0, 0),
      ];
      if (!target) {
        return fallback();
      }

      let result = null;
      try {
        if (opts.nodeType) {
          // 3D Model node: only the node API is meaningful here.
          if (typeof target.getNodeWorldTransform === "function") {
            const t = target.getNodeWorldTransform(opts.nodeType, opts.name, "offset");
            if (t && Number.isFinite(t.x) && Number.isFinite(t.y)) {
              result = [t.x, t.y, toFiniteNumber(t.z, 0)];
            }
          }
        } else if (opts.face && opts.face !== "none" && typeof target.getFaceImagePoint === "function") {
          result = target.getFaceImagePoint(opts.face, opts.name);
        } else if (opts.name !== undefined && typeof target.getImagePoint === "function") {
          result = target.getImagePoint(opts.name);
        }
      } catch (_error) {
        result = null;
      }

      if (!Array.isArray(result) || result.length < 2) {
        return fallback();
      }
      // Older runtimes return [x, y] only: use the instance elevation for Z.
      const z = result.length > 2 ? toFiniteNumber(result[2], 0) : fallback()[2];
      return [toFiniteNumber(result[0], 0), toFiniteNumber(result[1], 0), z];
    }

    _setJoinStyle(style) {
      const next = getComboKey(style, JOIN_STYLE_KEYS, this._joinStyle);
      if (next === this._joinStyle) {
        return;
      }
      this._joinStyle = next;
      this._markMeshDirty();
    }

    _rebuildMesh() {
      const inst = this.instance;
      const built = buildStrokeColumns({
        points: this._points,
        renderLod: this._getEffectiveRenderLod(),
        distortResolution: this._distortResolution,
        distortAmplitude: this._distortAmplitude,
        distortFrequency: this._distortFrequency,
        distortPhase: this._distortPhase,
        distortAxis: this._distortAxis,
        endCapStyle: this._endCapStyle,
        joinStyle: this._getEffectiveJoinStyle(),
        crossSection: this._crossSection,
        ribbonFacing: this._ribbonFacing,
        upVector: this._upVector,
        // The builder works in layout space. In relative space point Z is an
        // offset from the host's absolute elevation (layer + parent + own z); in
        // absolute space point Z already is layout Z. The mesh writer converts
        // back to host-relative Z either way.
        baseZ: this._getPointZBase(),
        cameraPosition: this._isBillboard() ? this._getCameraPosition() : null,
        relativeTransform:
          this._coordSpace === "relative" ? this._getRelativeTransform() : null,
      });

      this._built = built;
      this._meshDirty = false;
      this._meshRebuildCount += 1;
      this._lastTickRebuilt = true;
      this._lastLineLength = built.lineLength;
      this._lastVertexCount = built.vertexCount;
      this._lastRenderedPointCount = built.renderedPointCount;

      if (this._autoFit && this._coordSpace === "absolute") {
        this._fitHostToColumns(built);
        // The fit changed the host transform; record it so the next tick does
        // not see it as an external move and rebuild again.
        this._lastTransformSig = this._getTransformSignature();
      }

      this._applyMeshToHost(built);
      this._trigger("OnMeshRebuilt");
    }

    // ---------------------------------------------------------------------
    // Host mesh
    // ---------------------------------------------------------------------

    // Mesh API surface can vary across runtime paths; feature-detect it once per
    // call and warn once if the host cannot be meshed (e.g. a Text object).
    _getMeshApi() {
      const inst = this.instance;
      if (!inst) {
        return null;
      }
      const create = inst.createMesh ?? inst.CreateMesh;
      const setPoint = inst.setMeshPoint ?? inst.SetMeshPoint;
      const release = inst.releaseMesh ?? inst.ReleaseMesh;
      if (typeof create !== "function" || typeof setPoint !== "function") {
        if (!this._meshApiWarned) {
          this._meshApiWarned = true;
          console.warn(
            "[Line Renderer] The host object does not support mesh distortion. Attach the behavior to a Sprite or Tiled Background."
          );
        }
        return null;
      }
      return {
        create: create.bind(inst),
        setPoint: setPoint.bind(inst),
        release: typeof release === "function" ? release.bind(inst) : null,
      };
    }

    _releaseHostMesh() {
      if (!this._hostMeshColumns) {
        return;
      }
      this._hostMeshColumns = 0;
      this._hostMeshRows = 0;
      try {
        this._getMeshApi()?.release?.();
      } catch (_error) {
        // Host may already be destroyed.
      }
    }

    // Texture mapping is derived entirely from the host. Mesh texture
    // coordinates are normalised to the host's own texture rect, so u/v in
    // [0,1] reproduce exactly what the undistorted object shows:
    // - Sprite: [0,1] is the current animation frame on its spritesheet, so u
    //   must stay in range. The frame is stretched once along the whole line;
    //   UV scrolling is not possible.
    // - Tiled Background: [0,1] is the object's own tiling area, i.e.
    //   width / (imageWidth * imageScale) repeats. Mapping u = distance / width
    //   keeps the image at its native tile density along the line (one repeat
    //   per imageWidth * imageScaleX pixels of stroke), so the host's Image
    //   scale property controls the tiling. v = 0..1 across the line shows the
    //   same tiling the object's height would. Repeat wrap allows u outside
    //   [0,1], which is also what makes UV scrolling possible.
    _getHostUvMapping(built) {
      const inst = this.instance;
      const arcMin = built.arcMin;
      const arcSpan = Math.max(1e-6, built.arcMax - built.arcMin);
      const isTiled =
        typeof inst?.imageScaleX === "number" && typeof inst?.imageWidth === "number";

      if (!isTiled) {
        return {
          mode: "stretch",
          vMax: 1,
          mapU: (arcLength) => clamp01((arcLength - arcMin) / arcSpan),
        };
      }

      const width = Math.max(1e-4, Math.abs(toFiniteNumber(inst.width, 1)));
      const scroll = this._uvScrollOffset;
      return {
        mode: "tile",
        vMax: 1,
        mapU: (arcLength) => (arcLength + scroll) / width,
      };
    }

    // Write the layout-space columns into the host mesh. Mesh point x/y are
    // normalised to the host's unrotated box (0,0 = top-left, 1,1 =
    // bottom-right); values outside that range extend past the box. Mesh Z is
    // relative to the host's own Z elevation.
    _applyMeshToHost(built) {
      const inst = this.instance;
      const columns = built.columns;
      if (columns.length < 2) {
        this._releaseHostMesh();
        return;
      }

      const api = this._getMeshApi();
      if (!api) {
        return;
      }

      const rows = built.rows;
      const crossSection = built.crossSection;
      try {
        if (this._hostMeshColumns !== columns.length || this._hostMeshRows !== rows) {
          api.create(columns.length, rows);
          this._hostMeshColumns = columns.length;
          this._hostMeshRows = rows;
        }
      } catch (_error) {
        this._hostMeshColumns = 0;
        this._hostMeshRows = 0;
        return;
      }

      const x = toFiniteNumber(inst.x, 0);
      const y = toFiniteNumber(inst.y, 0);
      const width = safeDimension(inst.width, 1);
      const height = safeDimension(inst.height, 1);
      const originX = toFiniteNumber(inst.originX, 0.5);
      const originY = toFiniteNumber(inst.originY, 0.5);
      const angle = toFiniteNumber(inst.angle, 0);
      const totalZ = toFiniteNumber(inst.totalZ, 0);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const uv = this._getHostUvMapping(built);
      this._lastUvMode = uv.mode;

      // One reused options object: Construct copies the values on each call.
      const opts = { mode: "absolute", x: 0, y: 0, z: 0, zElevation: 0, u: 0, v: 0 };
      const write = (column, row, wx, wy, wz, u, v) => {
        // Layout -> host local (inverse rotation about the origin) -> normalised.
        const dx = wx - x;
        const dy = wy - y;
        const localX = dx * cosAngle + dy * sinAngle;
        const localY = -dx * sinAngle + dy * cosAngle;
        opts.x = localX / width + originX;
        opts.y = localY / height + originY;
        opts.z = wz - totalZ;
        opts.zElevation = opts.z;
        opts.u = u;
        opts.v = v;
        api.setPoint(column, row, opts);
      };

      try {
        for (let index = 0; index < columns.length; index++) {
          const column = columns[index];
          const u = uv.mapU(column.arcLength);
          for (let row = 0; row < rows; row++) {
            const vertex = columnVertex(column, row, rows, crossSection);
            write(index, row, vertex.x, vertex.y, vertex.z, u, vertex.v01 * uv.vMax);
          }
        }
      } catch (_error) {
        this._hostMeshColumns = 0;
        this._hostMeshRows = 0;
      }
    }

    // Absolute space: the host is a pure canvas (as in the Trail Renderer
    // pattern). Move and resize it so its box exactly covers the stroke, keep
    // its 2D angle (bounds are measured in the host's rotated frame), clear any
    // 3D rotation so mesh points are written in layout space, and drop the
    // host's own Z to the lowest vertex so Z sorting matches the line and all
    // mesh Z offsets stay >= 0. Keeps Construct's bounding box, on-screen
    // culling and collision polygon in step with the line.
    _fitHostToColumns(built) {
      const inst = this.instance;
      const columns = built?.columns ?? [];
      if (!inst || !columns.length) {
        return;
      }

      const x = toFiniteNumber(inst.x, 0);
      const y = toFiniteNumber(inst.y, 0);
      const angle = toFiniteNumber(inst.angle, 0);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      const include = (wx, wy) => {
        const dx = wx - x;
        const dy = wy - y;
        const localX = dx * cosAngle + dy * sinAngle;
        const localY = -dx * sinAngle + dy * cosAngle;
        minX = Math.min(minX, localX);
        minY = Math.min(minY, localY);
        maxX = Math.max(maxX, localX);
        maxY = Math.max(maxY, localY);
      };

      const rows = built.rows;
      for (const column of columns) {
        for (let row = 0; row < rows; row++) {
          const vertex = columnVertex(column, row, rows, built.crossSection);
          include(vertex.x, vertex.y);
        }
      }

      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const originX = toFiniteNumber(inst.originX, 0.5);
      const originY = toFiniteNumber(inst.originY, 0.5);
      // Where the origin sits inside the new local box, then back to layout space.
      const originLocalX = minX + originX * width;
      const originLocalY = minY + originY * height;
      const newX = x + originLocalX * cosAngle - originLocalY * sinAngle;
      const newY = y + originLocalX * sinAngle + originLocalY * cosAngle;

      try {
        inst.width = width;
        inst.height = height;
        inst.x = newX;
        inst.y = newY;
      } catch (_error) {
        // Host may not allow resizing; the mesh still renders relative to it.
      }

      // Host own Z = lowest vertex Z minus the elevation contributed by the
      // layer/parent (totalZ - z), so that totalZ lands on minZ.
      try {
        if (typeof inst.z === "number" && Number.isFinite(built.minZ)) {
          const inherited = toFiniteNumber(inst.totalZ, 0) - toFiniteNumber(inst.z, 0);
          inst.z = built.minZ - inherited;
        }
      } catch (_error) {
        // Z not writable on this host.
      }

      // Clear any 3D rotation so the normalised mesh coordinates are layout
      // space (feature-detected: r496+ 3D rotation API).
      try {
        if (typeof inst.setQuaternion === "function") {
          const q = typeof inst.getQuaternion === "function" ? inst.getQuaternion() : null;
          const identity =
            Array.isArray(q) && q.length >= 4 && q[0] === 0 && q[1] === 0 && q[2] === 0 && q[3] === 1;
          if (!q || !identity) {
            inst.setQuaternion(0, 0, 0, 1);
          }
        }
      } catch (_error) {
        // Host has no 3D rotation.
      }
    }

    _fitHostToLineNow() {
      if (!this._hostReady || !this._enabled) {
        return;
      }
      if (!this._built || this._meshDirty) {
        this._rebuildMesh();
        if (this._autoFit && this._coordSpace === "absolute") {
          return; // _rebuildMesh already fitted the host.
        }
      }
      this._fitHostToColumns(this._built);
      this._lastTransformSig = this._getTransformSignature();
      this._applyMeshToHost(this._built);
    }

    // ---------------------------------------------------------------------
    // Culling
    // ---------------------------------------------------------------------

    _shouldCull() {
      const inst = this.instance;
      if (!this._built?.bounds) {
        return inst?.isOnScreen === false;
      }

      const viewport = this._getViewportRect();
      if (!viewport) {
        return inst?.isOnScreen === false;
      }

      const bounds = this._built.bounds;
      return (
        bounds.right < viewport.left ||
        bounds.left > viewport.right ||
        bounds.bottom < viewport.top ||
        bounds.top > viewport.bottom
      );
    }

    _getViewportRect() {
      const inst = this.instance;
      const rect =
        inst?.layer?.getViewport?.() ??
        inst?.layer?.GetViewport?.() ??
        this.runtime?.layout?.getViewport?.() ??
        this.runtime?.layout?.GetViewport?.() ??
        null;
      if (!rect) {
        return null;
      }

      return {
        left: toFiniteNumber(rect.getLeft?.() ?? rect.left, Number.NEGATIVE_INFINITY),
        top: toFiniteNumber(rect.getTop?.() ?? rect.top, Number.NEGATIVE_INFINITY),
        right: toFiniteNumber(rect.getRight?.() ?? rect.right, Number.POSITIVE_INFINITY),
        bottom: toFiniteNumber(rect.getBottom?.() ?? rect.bottom, Number.POSITIVE_INFINITY),
      };
    }

    // ---------------------------------------------------------------------
    // Point helpers used by ACEs
    // ---------------------------------------------------------------------

    _coercePointIndex(index) {
      return Math.floor(toFiniteNumber(index, -1));
    }

    _isValidPointIndex(index) {
      return index >= 0 && index < this._points.length;
    }

    _newPoint(x, y, width = this._defaultWidth, z = 0) {
      return makePoint(x, y, width, z);
    }

    _getWorldPoint(index) {
      const point = this._points[index];
      if (!point) {
        return { x: 0, y: 0, z: 0, width: 0 };
      }

      // Layout Z: relative space offsets from the host elevation, absolute space
      // is layout Z already. The host angle is a yaw about Z, so it does not
      // rotate the Z component.
      const worldZ = this._getPointZBase() + toFiniteNumber(point.z, 0);

      if (this._coordSpace !== "relative") {
        return { ...point, z: worldZ };
      }

      const transform = this._getRelativeTransform();
      const scaleX = transform.scaleX;
      const scaleY = transform.scaleY;
      const cosAngle = Math.cos(transform.angle);
      const sinAngle = Math.sin(transform.angle);
      const localX = point.x * scaleX;
      const localY = point.y * scaleY;

      return {
        x: transform.x + localX * cosAngle - localY * sinAngle,
        y: transform.y + localX * sinAngle + localY * cosAngle,
        z: worldZ,
        width: point.width * Math.max(Math.abs(scaleX), Math.abs(scaleY)),
      };
    }

    _setPointCountInternal(count) {
      const nextCount = toCount(count, 2);
      if (nextCount === this._points.length) {
        return false;
      }

      if (nextCount > this._points.length) {
        while (this._points.length < nextCount) {
          this._points.push(this._newPoint(0, 0));
        }
      } else {
        this._points.length = nextCount;
      }

      this._markMeshDirty();
      this._trigger("OnPointCountChanged");
      return true;
    }

    _replacePoints(points, triggerPointCountChanged = false) {
      const previousCount = this._points.length;
      this._points =
        points.length >= 2 ? points.map(clonePoint) : createInitialPoints(2, this._defaultWidth);
      this._markMeshDirty();
      if (triggerPointCountChanged && previousCount !== this._points.length) {
        this._trigger("OnPointCountChanged");
      }
    }

    _getFirstPickedInstance(objectParam) {
      return (
        objectParam?.getFirstPickedInstance?.() ??
        objectParam?.getFirstPicked?.() ??
        objectParam?.GetFirstPicked?.() ??
        objectParam?.getFirstInstance?.() ??
        objectParam?.GetFirstInstance?.() ??
        objectParam?.getAllInstances?.()?.[0] ??
        objectParam?.GetInstances?.()?.[0] ??
        null
      );
    }

    _getPickedInstances(objectParam) {
      const instances =
        objectParam?.getPickedInstances?.() ??
        objectParam?.GetPickedInstances?.() ??
        objectParam?.getAllInstances?.() ??
        objectParam?.GetInstances?.() ??
        [];
      return Array.from(instances);
    }

    _buildArcPoints(cx, cy, radius, startAngle, endAngle, segments) {
      const pointCount = Math.max(1, Math.floor(toFiniteNumber(segments, 1)));
      const start = (toFiniteNumber(startAngle, 0) * Math.PI) / 180;
      const end = (toFiniteNumber(endAngle, 0) * Math.PI) / 180;
      const points = [];

      for (let index = 0; index <= pointCount; index++) {
        const t = index / pointCount;
        const angle = start + (end - start) * t;
        points.push(
          this._newPoint(
            toFiniteNumber(cx, 0) + Math.cos(angle) * toFiniteNumber(radius, 0),
            toFiniteNumber(cy, 0) + Math.sin(angle) * toFiniteNumber(radius, 0)
          )
        );
      }

      return points;
    }

    _buildBezierPoints(x1, y1, c1x, c1y, c2x, c2y, x2, y2, segments) {
      const pointCount = Math.max(1, Math.floor(toFiniteNumber(segments, 1)));
      const points = [];

      for (let index = 0; index <= pointCount; index++) {
        const t = index / pointCount;
        const oneMinusT = 1 - t;
        points.push(
          this._newPoint(
            oneMinusT ** 3 * toFiniteNumber(x1, 0) +
              3 * oneMinusT ** 2 * t * toFiniteNumber(c1x, 0) +
              3 * oneMinusT * t ** 2 * toFiniteNumber(c2x, 0) +
              t ** 3 * toFiniteNumber(x2, 0),
            oneMinusT ** 3 * toFiniteNumber(y1, 0) +
              3 * oneMinusT ** 2 * t * toFiniteNumber(c1y, 0) +
              3 * oneMinusT * t ** 2 * toFiniteNumber(c2y, 0) +
              t ** 3 * toFiniteNumber(y2, 0)
          )
        );
      }

      return points;
    }

    _catmullRom(points, subdivisions) {
      if (points.length < 2) {
        return points.map(clonePoint);
      }

      const steps = Math.max(1, Math.floor(toFiniteNumber(subdivisions, 1)));
      const result = [];
      const spline = (a, b, c, d, t) => {
        const t2 = t * t;
        const t3 = t2 * t;
        return (
          0.5 *
          (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
        );
      };

      for (let index = 0; index < points.length - 1; index++) {
        const p0 = points[Math.max(0, index - 1)];
        const p1 = points[index];
        const p2 = points[index + 1];
        const p3 = points[Math.min(points.length - 1, index + 2)];

        // t in [0, 1) per segment: the segment's own start point plus the
        // inserted subdivisions; the last control point is appended below.
        for (let step = 0; step < steps; step++) {
          const t = step / steps;
          result.push(
            makePoint(
              spline(p0.x, p1.x, p2.x, p3.x, t),
              spline(p0.y, p1.y, p2.y, p3.y, t),
              spline(p0.width, p1.width, p2.width, p3.width, t),
              spline(p0.z ?? 0, p1.z ?? 0, p2.z ?? 0, p3.z ?? 0, t)
            )
          );
        }
      }

      result.push(clonePoint(points[points.length - 1]));
      return result;
    }

    // ---------------------------------------------------------------------
    // Debugger, lifecycle, save/load
    // ---------------------------------------------------------------------

    _getDebuggerProperties() {
      return [
        {
          title: "$Line Renderer",
          properties: [
            { name: "$enabled", value: this._enabled },
            { name: "$coordSpace", value: this._coordSpace },
            { name: "$pointCount", value: this._points.length },
            { name: "$renderedPointCount", value: this._lastRenderedPointCount },
            { name: "$meshColumns", value: this._hostMeshColumns },
            { name: "$vertexCount", value: this._lastVertexCount },
            { name: "$lineLength", value: this._lastLineLength },
            { name: "$textureMapping", value: this._lastUvMode || "(host not meshed yet)" },
            { name: "$endCapStyle", value: this._endCapStyle },
            { name: "$joinStyle", value: this._getEffectiveJoinStyle() },
            { name: "$crossSection", value: this._isTube() ? `${this._crossSection} (tube)` : "2 (ribbon)" },
            { name: "$meshRows", value: this._hostMeshRows },
            { name: "$uvScrollOffset", value: this._uvScrollOffset },
            { name: "$distortAmplitude", value: this._distortAmplitude },
            { name: "$distortResolution", value: this._distortResolution },
            { name: "$renderLOD", value: this._renderLOD || "off" },
            { name: "$autoFit", value: this._autoFit },
            { name: "$ribbonFacing", value: this._ribbonFacing },
            {
              name: "$cameraSource",
              value: this._manualCamera ? "manual" : this._getCamera() ? "3D Camera object" : "none (top-down)",
            },
            { name: "$isCulled", value: this._isCulled },
            { name: "$meshRebuildCount", value: this._meshRebuildCount },
            { name: "$lastTickRebuilt", value: this._lastTickRebuilt },
          ],
        },
      ];
    }

    _release() {
      this._releaseHostMesh();
      this.events = {};
      super._release();
    }

    _saveToJson() {
      return {
        version: 2,
        enabled: this._enabled,
        points: this._points.map(clonePoint),
        coordSpace: this._coordSpace,
        relativeBaseWidth: this._relativeBaseWidth,
        relativeBaseHeight: this._relativeBaseHeight,
        uvScrollOffset: this._uvScrollOffset,
        distortPhase: this._distortPhase,
        distortAmplitude: this._distortAmplitude,
        distortFrequency: this._distortFrequency,
        distortSpeed: this._distortSpeed,
        distortAxis: this._distortAxis,
        distortResolution: this._distortResolution,
        uvScrollSpeed: this._uvScrollSpeed,
        endCapStyle: this._endCapStyle,
        joinStyle: this._joinStyle,
        crossSection: this._crossSection,
        ribbonFacing: this._ribbonFacing,
        renderLOD: this._renderLOD,
        frustumCullingEnabled: this._frustumCullingEnabled,
        autoFit: this._autoFit,
        manualCamera: this._manualCamera ? [...this._manualCamera] : null,
        upVector: [this._upVector.x, this._upVector.y, this._upVector.z],
      };
    }

    _loadFromJson(o) {
      this._enabled = o?.enabled === undefined ? this._enabled : !!o.enabled;
      this._points = Array.isArray(o?.points) && o.points.length >= 2
        ? o.points.map(clonePoint)
        : createInitialPoints(2, this._defaultWidth);
      this._coordSpace = getComboKey(o?.coordSpace, COORD_SPACE_KEYS, this._coordSpace);
      this._relativeBaseWidth = safeDimension(o?.relativeBaseWidth, this._relativeBaseWidth);
      this._relativeBaseHeight = safeDimension(o?.relativeBaseHeight, this._relativeBaseHeight);
      this._uvScrollOffset = toFiniteNumber(o?.uvScrollOffset, 0);
      this._distortPhase = toFiniteNumber(o?.distortPhase, 0);
      this._distortAmplitude = Math.max(0, toFiniteNumber(o?.distortAmplitude, this._distortAmplitude));
      this._distortFrequency = Math.max(0, toFiniteNumber(o?.distortFrequency, this._distortFrequency));
      this._distortSpeed = toFiniteNumber(o?.distortSpeed, this._distortSpeed);
      this._distortAxis = getComboKey(o?.distortAxis, DISTORT_AXIS_KEYS, this._distortAxis);
      this._distortResolution = Math.max(1, Math.floor(toFiniteNumber(o?.distortResolution, this._distortResolution)));
      this._uvScrollSpeed = toFiniteNumber(o?.uvScrollSpeed, this._uvScrollSpeed);
      this._defaultWidth = Math.abs(this._relativeBaseHeight) * 0.5;
      this._endCapStyle = getComboKey(o?.endCapStyle, END_CAP_KEYS, this._endCapStyle);
      this._joinStyle = getComboKey(o?.joinStyle, JOIN_STYLE_KEYS, this._joinStyle);
      this._crossSection = this._clampCrossSection(o?.crossSection ?? this._crossSection);
      this._ribbonFacing = getComboKey(o?.ribbonFacing, RIBBON_FACING_KEYS, this._ribbonFacing);
      this._renderLOD = Math.max(0, Math.floor(toFiniteNumber(o?.renderLOD, this._renderLOD)));
      this._frustumCullingEnabled = !!o?.frustumCullingEnabled;
      this._autoFit = !!o?.autoFit;
      this._manualCamera =
        Array.isArray(o?.manualCamera) && o.manualCamera.length >= 3
          ? o.manualCamera.slice(0, 3).map((v) => toFiniteNumber(v, 0))
          : null;
      if (Array.isArray(o?.upVector) && o.upVector.length >= 3) {
        this._setUpVector(o.upVector[0], o.upVector[1], o.upVector[2]);
      }
      this._camera = undefined;

      // Construct restores the host's own mesh with the savegame, but we own it:
      // recreate it from our state on the next tick.
      this._hostMeshColumns = 0;
      this._hostMeshRows = 0;
      this._built = null;
      this._lastTransformSig = null;
      this._hostReady = !!this.instance;
      if (!this._enabled) {
        try {
          this._getMeshApi()?.release?.();
        } catch (_error) {
          // ignore
        }
      }
      this._markMeshDirty();
    }

    // ---------------------------------------------------------------------
    // Public getters for C3 Script
    // ---------------------------------------------------------------------

    get MeshEnabled() {
      return this._enabled;
    }

    get MeshPointCount() {
      return this._points.length;
    }

    MeshGetPointX(index) {
      return this._isValidPointIndex(this._coercePointIndex(index))
        ? this._getWorldPoint(this._coercePointIndex(index)).x
        : 0;
    }

    MeshGetPointY(index) {
      return this._isValidPointIndex(this._coercePointIndex(index))
        ? this._getWorldPoint(this._coercePointIndex(index)).y
        : 0;
    }

    MeshGetPointZ(index) {
      return this._isValidPointIndex(this._coercePointIndex(index))
        ? this._getWorldPoint(this._coercePointIndex(index)).z
        : 0;
    }

    MeshGetPointWidth(index) {
      return this._isValidPointIndex(this._coercePointIndex(index))
        ? this._points[this._coercePointIndex(index)].width
        : 0;
    }

    get MeshLineLength() {
      return this._lastLineLength;
    }

    get MeshVertexCount() {
      return this._lastVertexCount;
    }

    get MeshRenderedPointCount() {
      return this._lastRenderedPointCount;
    }

    get MeshRenderLOD() {
      return this._renderLOD;
    }

    get MeshDistortResolution() {
      return this._distortResolution;
    }

    get MeshDistortAmplitude() {
      return this._distortAmplitude;
    }

    get MeshDistortFrequency() {
      return this._distortFrequency;
    }

    get MeshDistortSpeed() {
      return this._distortSpeed;
    }

    get MeshUVScrollSpeed() {
      return this._uvScrollSpeed;
    }

    get MeshUVScrollOffset() {
      return this._uvScrollOffset;
    }

    // "tile" for Tiled Background hosts, "stretch" for Sprites (derived from
    // the host at the last rebuild; empty before the first one).
    get MeshTextureMapping() {
      return this._lastUvMode;
    }

    get MeshCoordSpace() {
      return this._coordSpace;
    }

    get MeshEndCapStyle() {
      return this._endCapStyle;
    }

    get MeshJoinStyle() {
      return this._joinStyle;
    }

    get MeshCrossSection() {
      return this._crossSection;
    }
  };
}
