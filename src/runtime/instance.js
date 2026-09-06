import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";
import {
  COORD_SPACE_KEYS,
  DISTORT_AXIS_KEYS,
  END_CAP_KEYS,
  JOIN_STYLE_KEYS,
  RIBBON_FACING_KEYS,
  WAVE_SHAPE_KEYS,
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
  textureDistanceAt,
  toFiniteNumber,
  transformRelativePoint,
} from "../shared/meshstrokeShared.js";

// Hard cap on host mesh vertices (columns x rows) so a runaway point count or
// a dense tube cannot allocate an enormous mesh. Longer paths are LOD-reduced.
const MAX_MESH_VERTICES = 2048;
const MAX_CROSS_SECTION = 32;
// Largest point index an action may grow the list to.
const MAX_POINTS = 4096;

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
      this._endCapStyle = getComboKey(properties?.[1], END_CAP_KEYS, END_CAP_KEYS[0]);
      this._ribbonFacing = getComboKey(properties?.[2], RIBBON_FACING_KEYS, RIBBON_FACING_KEYS[0]);
      this._autoFit = properties?.[3] === undefined ? true : !!properties[3];
      this._joinStyle = getComboKey(properties?.[4], JOIN_STYLE_KEYS, JOIN_STYLE_KEYS[3]);
      this._crossSection = this._clampCrossSection(properties?.[5]);
      // "Enabled" is always the last property, like the built-in behaviors.
      this._enabled = properties?.[6] === undefined ? true : !!properties[6];

      // Runtime-only settings (actions), kept out of the Properties Bar so a new
      // user can get a rope on screen without touching them.
      this._coordSpace = COORD_SPACE_KEYS[0]; // absolute
      // Wave (distortion), in Sine-behavior terms: magnitude in pixels,
      // wavelength in pixels per cycle, period in seconds per cycle (0 = the
      // wave stands still), movement = which way points are pushed, shape.
      this._waveMagnitude = 0;
      this._wavelength = 100;
      this._wavePeriod = 1;
      this._waveMovement = DISTORT_AXIS_KEYS[3]; // across the line (perpendicular)
      this._waveShape = WAVE_SHAPE_KEYS[0];
      this._distortResolution = 1;

      // Derived from the host in _postCreate(): the object's height is the line
      // thickness, so path-building actions use half of it as the point width.
      this._defaultWidth = 16;

      this.events = {};

      // this.instance is null in the constructor. Seed a placeholder point list
      // so ACEs that run before _postCreate() have something valid to edit; the
      // box-spanning default is created once the host is ready.
      this._points = createInitialPoints(this._initialPointCount, this._defaultWidth);
      this._pointsTouched = false;
      // Per-point UID of a pinned instance (or null): pinned points follow
      // their instance every tick.
      this._pinnedUids = [];
      // Per-point image point / face followed by a pinned point (or null = origin).
      this._pinnedAttach = [];
      this._relativeBaseWidth = 1;
      this._relativeBaseHeight = 1;
      this._hostReady = false;

      this._built = null;
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
      // Box size last written by auto-fit (0 = none yet). Used to notice when
      // the user changes the object's height so the rope thickness can follow.
      this._fitWidth = 0;
      this._fitHeight = 0;
      // Size of the mesh currently created on the host (0 columns = none).
      this._hostMeshColumns = 0;
      this._hostMeshRows = 0;
      this._meshApiWarned = false;

      // Rebuild after the event sheet so actions run this frame are reflected in
      // the same frame's draw.
      this._setTicking2(true);
    }

    _postCreate() {
      this._initFromHost();
    }

    // One-time setup that needs the host instance. Called from _postCreate(),
    // and as a fallback from the first tick / first host-dependent ACE in case
    // the runtime does not call _postCreate().
    _initFromHost() {
      const inst = this.instance;
      if (this._hostReady || !inst) {
        return;
      }

      // Capture the placement size as the base for relative-space scaling, then
      // seed a ribbon spanning the host's box so the object looks unchanged
      // (like a plain Tiled Background) until points are edited.
      this._relativeBaseWidth = safeDimension(inst.width, 1);
      this._relativeBaseHeight = safeDimension(inst.height, 1);
      this._defaultWidth = Math.abs(this._relativeBaseHeight) * 0.5;
      // Only seed the default ribbon if no ACE has already shaped the line
      // (an action may run before the first tick).
      if (!this._pointsTouched) {
        const local = createBoxSpanningPoints(
          this._initialPointCount,
          inst.width,
          inst.height,
          inst.originX,
          inst.originY,
          this._defaultWidth
        );
        // In absolute space points are layout co-ordinates: place the initial
        // ribbon on the object by running the local points through its transform.
        this._points =
          this._coordSpace === "relative"
            ? local
            : local.map((point) => {
                const world = transformRelativePoint(point, {
                  x: inst.x, y: inst.y, angle: inst.angle, scaleX: 1, scaleY: 1,
                });
                return makePoint(world.x, world.y, point.width, toFiniteNumber(inst.totalZ, 0) + point.z);
              });
        this._lastRenderedPointCount = this._points.length;
      }
      this._hostReady = true;
      this._markMeshDirty();
    }

    // ---------------------------------------------------------------------
    // Pinned points (follow instances automatically)
    // ---------------------------------------------------------------------

    _getInstanceUid(target) {
      const uid = target?.uid;
      return Number.isInteger(uid) ? uid : null;
    }

    // attach (optional): { face, name } image point to follow on the instance.
    _pinPoint(index, target, attach = null) {
      const uid = this._getInstanceUid(target);
      if (uid === null || !this._ensurePointIndex(index)) {
        return false;
      }
      this._pinnedUids[index] = uid;
      this._pinnedAttach[index] = attach && (attach.name !== undefined && attach.name !== 0 && attach.name !== "0" && attach.name !== "" || (attach.face && attach.face !== "none"))
        ? { face: attach.face ?? "none", name: attach.name }
        : null;
      this._applyPinnedPoint(index, target);
      this._markMeshDirty();
      return true;
    }

    _unpinPoint(index) {
      if (index >= 0 && index < this._pinnedUids.length) {
        this._pinnedUids[index] = null;
        this._pinnedAttach[index] = null;
      }
    }

    _unpinAllPoints() {
      this._pinnedUids = [];
      this._pinnedAttach = [];
    }

    _isPointPinned(index) {
      return this._isValidPointIndex(index) && Number.isInteger(this._pinnedUids[index]);
    }

    _resolvePinnedInstance(uid) {
      try {
        return this.runtime?.getInstanceByUid?.(uid) ?? null;
      } catch (_error) {
        return null;
      }
    }

    // Copy a target instance's position into a point (in point space).
    _applyPinnedPoint(index, target) {
      const point = this._points[index];
      if (!point || !target) {
        return false;
      }
      const attach = this._pinnedAttach[index];
      const position = attach
        ? this._layoutToPointSpace(...this._getAttachPosition(target, attach))
        : this._instanceToPointSpace(target);
      if (point.x === position.x && point.y === position.y && point.z === position.z) {
        return false;
      }
      point.x = position.x;
      point.y = position.y;
      point.z = position.z;
      return true;
    }

    // Every tick: move pinned points to their instances. A destroyed instance
    // unpins its point, which keeps its last position.
    _updatePinnedPoints() {
      let changed = false;
      for (let index = 0; index < this._pinnedUids.length && index < this._points.length; index++) {
        const uid = this._pinnedUids[index];
        if (!Number.isInteger(uid)) {
          continue;
        }
        const target = this._resolvePinnedInstance(uid);
        if (!target) {
          this._pinnedUids[index] = null;
          continue;
        }
        if (this._applyPinnedPoint(index, target)) {
          changed = true;
        }
      }
      if (changed) {
        this._markMeshDirty();
      }
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

    _setWaveMagnitude(magnitude) {
      this._waveMagnitude = Math.max(0, toFiniteNumber(magnitude, 0));
      this._markMeshDirty();
    }

    _setWavelength(wavelength) {
      this._wavelength = Math.max(1e-4, toFiniteNumber(wavelength, 100));
      this._markMeshDirty();
    }

    _setWavePeriod(period) {
      this._wavePeriod = toFiniteNumber(period, 0);
      this._markMeshDirty();
    }

    _setWaveMovement(movement) {
      this._waveMovement = getComboKey(movement, DISTORT_AXIS_KEYS, this._waveMovement);
      this._markMeshDirty();
    }

    _setWaveShape(shape) {
      this._waveShape = getComboKey(shape, WAVE_SHAPE_KEYS, this._waveShape);
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
      this._pointsTouched = true;
    }

    // Report a host mesh failure once, so a silent no-op is diagnosable.
    _reportMeshError(stage, error) {
      if (this._meshErrorReported) {
        return;
      }
      this._meshErrorReported = true;
      console.error(`[Line Renderer] ${stage} failed on the host object:`, error);
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
      if (!this._hostReady) {
        this._initFromHost();
      }
      if (!this._enabled || !this._hostReady) {
        return;
      }
      const inst = this.instance;
      if (!inst) {
        return;
      }

      this._updatePinnedPoints();
      this._adoptHostHeight();

      const dt = this._getDt();
      const distortionActive = this._waveMagnitude > 0;

      this._lastTickRebuilt = false;

      const sig = this._getTransformSignature();
      if (sig !== this._lastTransformSig) {
        this._lastTransformSig = sig;
        this._meshDirty = true;
      }

      if (distortionActive && this._wavePeriod !== 0) {
        // One full cycle per period: the wave travels one wavelength per period.
        this._distortPhase += ((Math.PI * 2) / this._wavePeriod) * dt;
      }

      this._isCulled = this._frustumCullingEnabled && this._shouldCull();
      if (this._isCulled) {
        return;
      }

      if (!this._meshDirty && !distortionActive) {
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
      if (!this._ensurePointIndex(pointIndex)) {
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
        distortAmplitude: this._waveMagnitude,
        distortFrequency: (Math.PI * 2) / Math.max(1e-4, this._wavelength),
        distortPhase: this._distortPhase,
        distortAxis: this._waveMovement,
        waveShape: this._waveShape,
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
      this._fitWidth = 0;
      this._fitHeight = 0;
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

    // Host kind, for the debugger only: the mapping below is the same for every
    // host because each of them draws its own content across the object's box.
    _getHostKind() {
      const inst = this.instance;
      if (!inst) {
        return "none";
      }
      if ("animationFrame" in inst) {
        return "sprite";
      }
      if (typeof inst.imageScaleX === "number" && typeof inst.imageWidth === "number") {
        return "tiled background";
      }
      return "other";
    }

    // Texture mapping. Construct clamps mesh texture co-ordinates to [0,1],
    // and [0,1] is whatever the host draws across its own box: a Sprite frame or
    // a Tiled Background's tiling (image scale, offset, angle, randomisation and
    // all). The behavior never touches those
    // settings. Instead u runs from 0 at the start of the line to 1 at the end
    // in TEXTURE distance (tile segments 1:1, stretch segments frozen at their
    // rest length), and Auto-fit sizes the box to that texture length by the
    // line thickness: the object is the unrolled rope. So a Tiled Background
    // tiles at exactly the density its image scale says and its Set image offset
    // scrolls the rope 1:1; a Sprite stretches its frame along the rope.
    _getHostUvMapping(built) {
      const texMin = built.texMin;
      const texSpan = Math.max(1e-6, built.texMax - built.texMin);
      return {
        mode: this._getHostKind(),
        vMax: 1,
        mapU: (arcLength) => clamp01((textureDistanceAt(built.textureMap, arcLength) - texMin) / texSpan),
      };
    }

    // While auto-fit owns the box (absolute space), the object's height is also
    // an input: if the user changed it since the last fit (editor, Set size,
    // a tween), scale every point's height by the same factor so the rope
    // thickness follows the object, like resizing a plain Tiled Background.
    _adoptHostHeight() {
      if (!this._autoFit || this._coordSpace !== "absolute" || !(this._fitHeight > 0)) {
        return;
      }
      const height = Math.abs(toFiniteNumber(this.instance?.height, this._fitHeight));
      if (!(height > 0) || Math.abs(height - this._fitHeight) < 1e-6) {
        return;
      }
      const factor = height / this._fitHeight;
      for (const point of this._points) {
        point.width *= factor;
      }
      this._defaultWidth *= factor;
      this._fitHeight = height;
      this._markMeshDirty();
    }

    // Nominal thickness of the line: twice the mean point width.
    _getMeanThickness() {
      if (!this._points.length) {
        return Math.max(1e-4, this._defaultWidth * 2);
      }
      let sum = 0;
      for (const point of this._points) {
        sum += Math.max(0, toFiniteNumber(point.width, 0));
      }
      return Math.max(1e-4, (2 * sum) / this._points.length);
    }

    // ---------------------------------------------------------------------
    // Per-point texture stretch
    // ---------------------------------------------------------------------

    _segmentLength(index) {
      const a = this._points[index];
      const b = this._points[index + 1];
      if (!a || !b) {
        return 0;
      }
      return Math.hypot(b.x - a.x, b.y - a.y, (b.z ?? 0) - (a.z ?? 0));
    }

    // stretch: the segment starting at the point keeps a fixed texture length.
    // Its rest length is captured from the current segment length unless one
    // was set explicitly (restLength > 0 already or given).
    _setPointStretch(index, stretch, restLength = null) {
      if (!this._ensurePointIndex(index)) {
        return false;
      }
      const point = this._points[index];
      point.stretch = !!stretch;
      if (restLength !== null) {
        point.restLength = Math.max(0, toFiniteNumber(restLength, 0));
      } else if (point.stretch) {
        point.restLength = this._segmentLength(index);
      } else {
        point.restLength = 0;
      }
      this._markMeshDirty();
      return true;
    }

    // Point "height" = full line thickness at the point (stored as half-width).
    _setPointHeight(index, height) {
      if (!this._ensurePointIndex(index)) {
        return false;
      }
      this._points[index].width = Math.max(0, toFiniteNumber(height, 0)) * 0.5;
      this._markMeshDirty();
      return true;
    }

    // Point "width" = texture width of the segment starting at the point. A
    // positive width fixes it (the segment stretches the image to that width);
    // 0 means automatic, i.e. the segment's actual length (Tile).
    _setPointWidth(index, width) {
      if (!this._ensurePointIndex(index)) {
        return false;
      }
      const point = this._points[index];
      const value = Math.max(0, toFiniteNumber(width, 0));
      point.restLength = value;
      point.stretch = value > 0;
      this._markMeshDirty();
      return true;
    }

    // Combined size setter used by the ACEs: -1 keeps a value.
    _setPointSize(index, width, height) {
      if (!this._ensurePointIndex(index)) {
        return false;
      }
      const w = toFiniteNumber(width, -1);
      const h = toFiniteNumber(height, -1);
      if (h >= 0) {
        this._points[index].width = h * 0.5;
      }
      if (w >= 0) {
        const point = this._points[index];
        point.restLength = w;
        point.stretch = w > 0;
      }
      this._markMeshDirty();
      return true;
    }

    _getPointWidth(index) {
      const point = this._points[index];
      if (!point) {
        return 0;
      }
      return point.stretch && point.restLength > 0 ? point.restLength : this._segmentLength(index);
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
      } catch (error) {
        this._hostMeshColumns = 0;
        this._hostMeshRows = 0;
        this._reportMeshError("createMesh", error);
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
      } catch (error) {
        this._hostMeshColumns = 0;
        this._hostMeshRows = 0;
        this._reportMeshError("setMeshPoint", error);
      }
    }

    // Absolute space: the host is a pure canvas (as in the Trail Renderer
    // pattern), sized as the UNROLLED rope: width = texture length, height =
    // line thickness, centred on the line's bounds with no rotation. Because
    // mesh texture co-ordinates span exactly the object's box, this makes a
    // Tiled Background tile at the density its own image scale says, lets its
    // image offset scroll the rope 1:1, all without the behavior touching any
    // image setting. The host's
    // own Z is lowered to the lowest vertex so Z sorting matches the line and
    // mesh Z offsets stay >= 0, and any 3D rotation is cleared so mesh points
    // are written in layout space.
    _fitHostToColumns(built) {
      const inst = this.instance;
      const columns = built?.columns ?? [];
      if (!inst || !columns.length || !built.bounds) {
        return;
      }

      const width = Math.max(1, built.texMax - built.texMin);
      const height = Math.max(1, this._getMeanThickness());
      const centerX = (built.bounds.left + built.bounds.right) * 0.5;
      const centerY = (built.bounds.top + built.bounds.bottom) * 0.5;
      const originX = toFiniteNumber(inst.originX, 0.5);
      const originY = toFiniteNumber(inst.originY, 0.5);

      try {
        inst.angle = 0;
        inst.width = width;
        inst.height = height;
        inst.x = centerX + (originX - 0.5) * width;
        inst.y = centerY + (originY - 0.5) * height;
        this._fitWidth = width;
        this._fitHeight = height;
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

      // Clear any 3D rotation (feature-detected: r496+ 3D rotation API).
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

    // Point-setting actions may address an index past the end of the list; the
    // list grows to include it so "Set point PointA.IID ..." in a For each just
    // works. Gap points are placed on the current last point so no stray
    // segment shoots off to the origin. Returns false for negative or absurd
    // indices.
    _ensurePointIndex(index) {
      if (!Number.isInteger(index) || index < 0 || index >= MAX_POINTS) {
        return false;
      }
      if (index < this._points.length) {
        return true;
      }
      const last = this._points[this._points.length - 1] ?? this._newPoint(0, 0);
      while (this._points.length <= index) {
        this._points.push(this._newPoint(last.x, last.y, this._defaultWidth, last.z));
      }
      this._markMeshDirty();
      this._trigger("OnPointCountChanged");
      return true;
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
        if (this._pinnedUids.length > nextCount) {
          this._pinnedUids.length = nextCount;
        }
      }

      this._markMeshDirty();
      this._trigger("OnPointCountChanged");
      return true;
    }

    // Insert / remove bookkeeping shared by the point ACEs so pins stay aligned
    // with their points.
    _insertPointAt(index, point) {
      const insertAt = Math.max(0, Math.min(this._points.length, index));
      this._points.splice(insertAt, 0, point);
      if (this._pinnedUids.length > insertAt) {
        this._pinnedUids.splice(insertAt, 0, null);
        this._pinnedAttach.splice(insertAt, 0, null);
      }
      this._markMeshDirty();
      this._trigger("OnPointCountChanged");
    }

    _removePointAt(index) {
      if (!this._isValidPointIndex(index) || this._points.length <= 2) {
        return false;
      }
      this._points.splice(index, 1);
      if (this._pinnedUids.length > index) {
        this._pinnedUids.splice(index, 1);
        this._pinnedAttach.splice(index, 1);
      }
      this._markMeshDirty();
      this._trigger("OnPointCountChanged");
      return true;
    }

    // Replacing the whole point list drops any pins (the new points are not
    // the pinned ones) unless the caller supplies matching pins.
    _replacePoints(points, triggerPointCountChanged = false, pinnedUids = null) {
      const previousCount = this._points.length;
      this._points =
        points.length >= 2 ? points.map(clonePoint) : createInitialPoints(2, this._defaultWidth);
      this._pinnedUids = Array.isArray(pinnedUids) ? pinnedUids.slice(0, this._points.length) : [];
      this._pinnedAttach = [];
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
            { name: "$pinnedPoints", value: this._pinnedUids.filter((uid) => Number.isInteger(uid)).length },
            { name: "$hostReady", value: this._hostReady },
            { name: "$meshError", value: this._meshErrorReported ? "see console" : "none" },
            { name: "$renderedPointCount", value: this._lastRenderedPointCount },
            { name: "$meshColumns", value: this._hostMeshColumns },
            { name: "$vertexCount", value: this._lastVertexCount },
            { name: "$lineLength", value: this._lastLineLength },
            { name: "$textureMapping", value: this._lastUvMode || "(host not meshed yet)" },
            { name: "$textureLength", value: this._built ? this._built.texMax - this._built.texMin : 0 },
            { name: "$stretchPoints", value: this._points.filter((p) => p.stretch).length },
            { name: "$endCapStyle", value: this._endCapStyle },
            { name: "$joinStyle", value: this._getEffectiveJoinStyle() },
            { name: "$crossSection", value: this._isTube() ? `${this._crossSection} (tube)` : "2 (ribbon)" },
            { name: "$meshRows", value: this._hostMeshRows },
            { name: "$waveMagnitude", value: this._waveMagnitude },
            { name: "$wavelength", value: this._wavelength },
            { name: "$wavePeriod", value: this._wavePeriod },
            { name: "$waveMovement", value: this._waveMovement },
            { name: "$waveShape", value: this._waveShape },
            { name: "$waveResolution", value: this._distortResolution },
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
        distortPhase: this._distortPhase,
        waveMagnitude: this._waveMagnitude,
        wavelength: this._wavelength,
        wavePeriod: this._wavePeriod,
        waveMovement: this._waveMovement,
        waveShape: this._waveShape,
        distortResolution: this._distortResolution,
        endCapStyle: this._endCapStyle,
        joinStyle: this._joinStyle,
        crossSection: this._crossSection,
        ribbonFacing: this._ribbonFacing,
        renderLOD: this._renderLOD,
        frustumCullingEnabled: this._frustumCullingEnabled,
        autoFit: this._autoFit,
        manualCamera: this._manualCamera ? [...this._manualCamera] : null,
        upVector: [this._upVector.x, this._upVector.y, this._upVector.z],
        pinnedUids: this._pinnedUids.map((uid) => (Number.isInteger(uid) ? uid : null)),
        pinnedAttach: this._pinnedAttach.map((a) => (a ? { face: a.face, name: a.name } : null)),
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
      this._distortPhase = toFiniteNumber(o?.distortPhase, 0);
      this._waveMagnitude = Math.max(0, toFiniteNumber(o?.waveMagnitude, this._waveMagnitude));
      this._wavelength = Math.max(1e-4, toFiniteNumber(o?.wavelength, this._wavelength));
      this._wavePeriod = toFiniteNumber(o?.wavePeriod, this._wavePeriod);
      this._waveMovement = getComboKey(o?.waveMovement, DISTORT_AXIS_KEYS, this._waveMovement);
      this._waveShape = getComboKey(o?.waveShape, WAVE_SHAPE_KEYS, this._waveShape);
      this._distortResolution = Math.max(1, Math.floor(toFiniteNumber(o?.distortResolution, this._distortResolution)));
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
      this._pinnedUids = Array.isArray(o?.pinnedUids)
        ? o.pinnedUids.slice(0, this._points.length).map((uid) => (Number.isInteger(uid) ? uid : null))
        : [];
      this._pinnedAttach = Array.isArray(o?.pinnedAttach)
        ? o.pinnedAttach.slice(0, this._points.length).map((a) => (a && typeof a === "object" ? { face: a.face ?? "none", name: a.name } : null))
        : [];
      this._pointsTouched = true;
      this._camera = undefined;

      // Construct restores the host's own mesh with the savegame, but we own it:
      // recreate it from our state on the next tick.
      this._hostMeshColumns = 0;
      this._hostMeshRows = 0;
      this._fitWidth = 0;
      this._fitHeight = 0;
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

    get MeshWaveMagnitude() {
      return this._waveMagnitude;
    }

    get MeshWavelength() {
      return this._wavelength;
    }

    get MeshWavePeriod() {
      return this._wavePeriod;
    }

    get MeshWaveMovement() {
      return this._waveMovement;
    }

    get MeshWaveShape() {
      return this._waveShape;
    }

    get MeshTextureLength() {
      return this._built ? this._built.texMax - this._built.texMin : 0;
    }

    MeshGetPointTextureWidth(index) {
      const pointIndex = this._coercePointIndex(index);
      return this._isValidPointIndex(pointIndex) ? this._getPointWidth(pointIndex) : 0;
    }

    MeshGetPointHeight(index) {
      const pointIndex = this._coercePointIndex(index);
      return this._isValidPointIndex(pointIndex) ? this._points[pointIndex].width * 2 : 0;
    }

    MeshIsPointStretch(index) {
      const pointIndex = this._coercePointIndex(index);
      return this._isValidPointIndex(pointIndex) && !!this._points[pointIndex].stretch;
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
