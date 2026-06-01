import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";
import {
  BLEND_MODE_KEYS,
  COORD_SPACE_KEYS,
  DISTORT_AXIS_KEYS,
  END_CAP_KEYS,
  SAMPLING_MODE_KEYS,
  buildStrokeMesh,
  clamp01,
  colorToC3,
  createInitialPoints,
  getBlendModeValue,
  getComboKey,
  getSamplingValue,
  remapUvsToTexRect,
  toCount,
  toFiniteNumber,
} from "../shared/meshstrokeShared.js";

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();
      this._setTicking(true);

      const properties = this._getInitProperties();
      const initialPointCount = toCount(properties?.[0], 2);
      this._strokeTexturePath = String(properties?.[1] ?? "").trim();
      this._textureTileLength = Math.max(0.0001, toFiniteNumber(properties?.[2], 64));
      this._uvScrollSpeed = toFiniteNumber(properties?.[3], 0);
      this._defaultWidth = Math.max(0, toFiniteNumber(properties?.[4], 16));
      this._distortAmplitude = Math.max(0, toFiniteNumber(properties?.[5], 0));
      this._distortFrequency = Math.max(0, toFiniteNumber(properties?.[6], 1));
      this._distortSpeed = toFiniteNumber(properties?.[7], 1);
      this._distortAxis = getComboKey(properties?.[8], DISTORT_AXIS_KEYS, DISTORT_AXIS_KEYS[2]);
      this._endCapStyle = getComboKey(properties?.[9], END_CAP_KEYS, END_CAP_KEYS[0]);
      this._blendMode = getComboKey(properties?.[10], BLEND_MODE_KEYS, BLEND_MODE_KEYS[0]);
      this._samplingMode = getComboKey(properties?.[11], SAMPLING_MODE_KEYS, SAMPLING_MODE_KEYS[0]);
      this._debugPoints = !!properties?.[12];
      this._editorPreview = properties?.[13];

      this.events = {};
      this._points = createInitialPoints(initialPointCount, this._defaultWidth);
      this._meshData = buildStrokeMesh({ points: [] });
      this._uvScrollOffset = 0;
      this._distortPhase = 0;
      this._meshDirty = true;
      this._meshRebuildCount = 0;
      this._lastTickRebuilt = false;
      this._lastLineLength = 0;
      this._lastVertexCount = 0;
      this._lastRenderedPointCount = this._points.length;
      this._renderLOD = 0;
      this._distortResolution = 1;
      this._frustumCullingEnabled = false;
      this._isCulled = false;
      this._coordSpace = COORD_SPACE_KEYS[0];
      this._strokeTexture = null;
      this._strokeTexRect = null;
      this._relativeBaseWidth = Math.max(1e-4, Math.abs(toFiniteNumber(this.width, 1)));
      this._relativeBaseHeight = Math.max(1e-4, Math.abs(toFiniteNumber(this.height, 1)));

      this.opacity = 1;
      this.blendMode = getBlendModeValue(this._blendMode);
      this.sampling = getSamplingValue(this._samplingMode);
    }

    _trigger(method) {
      this.dispatch(method);
      super._trigger(self.C3[AddonTypeMap[addonType]][id].Cnds[method]);
    }

    onCreate() {
      this._resolveStrokeTexture();
      this._syncInstanceAppearance();
    }

    _tick() {
      const dt = Math.max(0, toFiniteNumber(this.dt, 0));
      const distortionActive = this._distortAmplitude > 0;
      const uvActive = this._uvScrollSpeed !== 0;

      this._lastTickRebuilt = false;

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

    _draw(renderer) {
      if (this._isCulled || !this._meshData?.vertexCount) {
        return;
      }

      const blendMode = getBlendModeValue(this._blendMode);
      if (blendMode === "normal") {
        renderer.SetAlphaBlendMode?.();
      } else {
        renderer.SetBlendMode?.(blendMode);
      }

      const texture = this._strokeTexture;
      const texRect = this._strokeTexRect;
      if (texture) {
        renderer.SetTextureFillMode?.();
        renderer.SetTexture?.(texture, getSamplingValue(this._samplingMode));
        renderer.ResetColor?.();
      } else {
        renderer.SetColorFillMode?.();
        renderer.SetColorRgba?.(1, 1, 1, this.opacity ?? 1);
      }

      const uvs = texture ? remapUvsToTexRect(this._meshData.uvs, texRect) : this._meshData.uvs;
      if (typeof renderer.DrawMesh === "function") {
        renderer.DrawMesh(
          this._meshData.positions,
          uvs,
          this._meshData.indices,
          this._meshData.colors
        );
      } else if (typeof renderer.DrawTriangleStrip === "function") {
        renderer.DrawTriangleStrip(this._meshData.buffer);
      }

      if (this._debugPoints) {
        this._drawDebugPoints(renderer);
      }
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

    _resolveStrokeTexture() {
      if (!this._strokeTexturePath) {
        this._strokeTexture = null;
        this._strokeTexRect = null;
        return;
      }

      try {
        const assetManager =
          this.runtime?.getAssetManager?.() ?? this.runtime?.assetManager ?? this.runtime?.assets;
        const texture =
          assetManager?.getTexture?.(this._strokeTexturePath) ??
          assetManager?.GetTexture?.(this._strokeTexturePath) ??
          null;
        this._strokeTexture = texture;
        this._strokeTexRect =
          texture?.GetTexRect?.() ?? texture?.getTexRect?.() ?? texture?.texRect ?? null;
      } catch (_error) {
        this._strokeTexture = null;
        this._strokeTexRect = null;
      }
    }

    _syncInstanceAppearance() {
      this.blendMode = getBlendModeValue(this._blendMode);
      this.sampling = getSamplingValue(this._samplingMode);
    }

    _markMeshDirty() {
      this._meshDirty = true;
    }

    _coercePointIndex(index) {
      return Math.floor(toFiniteNumber(index, -1));
    }

    _isValidPointIndex(index) {
      return index >= 0 && index < this._points.length;
    }

    _getRelativeTransform() {
      return {
        x: toFiniteNumber(this.x, 0),
        y: toFiniteNumber(this.y, 0),
        angle: toFiniteNumber(this.angle, 0),
        scaleX: Math.abs(toFiniteNumber(this.width, this._relativeBaseWidth || 1)) /
          Math.max(this._relativeBaseWidth, 1e-4),
        scaleY: Math.abs(toFiniteNumber(this.height, this._relativeBaseHeight || 1)) /
          Math.max(this._relativeBaseHeight, 1e-4),
      };
    }

    _getRenderablePoints() {
      return this._coordSpace === "relative"
        ? this._points.map((point) => ({ ...point }))
        : this._points;
    }

    _rebuildMesh() {
      this._meshData = buildStrokeMesh({
        points: this._points,
        renderLod: this._renderLOD,
        distortResolution: this._distortResolution,
        textureTileLength: this._textureTileLength,
        uvScrollOffset: this._uvScrollOffset,
        distortAmplitude: this._distortAmplitude,
        distortFrequency: this._distortFrequency,
        distortPhase: this._distortPhase,
        distortAxis: this._distortAxis,
        endCapStyle: this._endCapStyle,
        opacity: clamp01(toFiniteNumber(this.opacity, 1)),
        relativeTransform:
          this._coordSpace === "relative" ? this._getRelativeTransform() : null,
      });

      this._meshDirty = false;
      this._meshRebuildCount += 1;
      this._lastTickRebuilt = true;
      this._lastLineLength = this._meshData.lineLength;
      this._lastVertexCount = this._meshData.vertexCount;
      this._lastRenderedPointCount = this._meshData.renderedPointCount;
      this._trigger("OnMeshRebuilt");
    }

    _shouldCull() {
      if (!this._meshData?.bounds) {
        return this.isOnScreen === false;
      }

      const viewport = this._getViewportRect();
      if (!viewport) {
        return this.isOnScreen === false;
      }

      const bounds = this._meshData.bounds;
      return (
        bounds.right < viewport.left ||
        bounds.left > viewport.right ||
        bounds.bottom < viewport.top ||
        bounds.top > viewport.bottom
      );
    }

    _getViewportRect() {
      const rect =
        this.layer?.getViewport?.() ??
        this.layer?.GetViewport?.() ??
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

    _drawDebugPoints(renderer) {
      renderer.SetColorFillMode?.();

      for (let index = 0; index < this._points.length; index++) {
        const point = this._getWorldPoint(index);
        const size = 3;
        renderer.SetColorRgba?.(1, 0.25, 0.25, 1);
        renderer.Rect2?.(point.x - size, point.y - size, point.x + size, point.y + size);
      }
    }

    _getWorldPoint(index) {
      const point = this._points[index];
      if (!point) {
        return { x: 0, y: 0, width: 0, r: 0, g: 0, b: 0, a: 0 };
      }

      if (this._coordSpace !== "relative") {
        return { ...point };
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
        width: point.width * Math.max(scaleX, scaleY),
        r: point.r,
        g: point.g,
        b: point.b,
        a: point.a,
      };
    }

    _setPointCountInternal(count) {
      const nextCount = toCount(count, 2);
      if (nextCount === this._points.length) {
        return false;
      }

      if (nextCount > this._points.length) {
        while (this._points.length < nextCount) {
          this._points.push({
            x: 0,
            y: 0,
            width: this._defaultWidth,
            r: 1,
            g: 1,
            b: 1,
            a: 1,
          });
        }
      } else {
        this._points.length = nextCount;
      }

      this._markMeshDirty();
      this._trigger("OnPointCountChanged");
      return true;
    }

    _setPointColorInternal(index, color) {
      if (!this._isValidPointIndex(index)) {
        return false;
      }

      this._points[index].r = color.r;
      this._points[index].g = color.g;
      this._points[index].b = color.b;
      this._points[index].a = color.a;
      this._markMeshDirty();
      return true;
    }

    _replacePoints(points, triggerPointCountChanged = false) {
      const previousCount = this._points.length;
      this._points = points.length >= 2 ? points : createInitialPoints(2, this._defaultWidth);
      this._markMeshDirty();
      if (triggerPointCountChanged && previousCount !== this._points.length) {
        this._trigger("OnPointCountChanged");
      }
    }

    _getFirstPickedInstance(objectParam) {
      return (
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
        points.push({
          x: toFiniteNumber(cx, 0) + Math.cos(angle) * toFiniteNumber(radius, 0),
          y: toFiniteNumber(cy, 0) + Math.sin(angle) * toFiniteNumber(radius, 0),
          width: this._defaultWidth,
          r: 1,
          g: 1,
          b: 1,
          a: 1,
        });
      }

      return points;
    }

    _buildBezierPoints(x1, y1, c1x, c1y, c2x, c2y, x2, y2, segments) {
      const pointCount = Math.max(1, Math.floor(toFiniteNumber(segments, 1)));
      const points = [];

      for (let index = 0; index <= pointCount; index++) {
        const t = index / pointCount;
        const oneMinusT = 1 - t;
        points.push({
          x:
            oneMinusT ** 3 * toFiniteNumber(x1, 0) +
            3 * oneMinusT ** 2 * t * toFiniteNumber(c1x, 0) +
            3 * oneMinusT * t ** 2 * toFiniteNumber(c2x, 0) +
            t ** 3 * toFiniteNumber(x2, 0),
          y:
            oneMinusT ** 3 * toFiniteNumber(y1, 0) +
            3 * oneMinusT ** 2 * t * toFiniteNumber(c1y, 0) +
            3 * oneMinusT * t ** 2 * toFiniteNumber(c2y, 0) +
            t ** 3 * toFiniteNumber(y2, 0),
          width: this._defaultWidth,
          r: 1,
          g: 1,
          b: 1,
          a: 1,
        });
      }

      return points;
    }

    _catmullRom(points, subdivisions) {
      if (points.length < 2) {
        return points.map((point) => ({ ...point }));
      }

      const steps = Math.max(1, Math.floor(toFiniteNumber(subdivisions, 1)));
      const result = [];

      for (let index = 0; index < points.length - 1; index++) {
        const p0 = points[Math.max(0, index - 1)];
        const p1 = points[index];
        const p2 = points[index + 1];
        const p3 = points[Math.min(points.length - 1, index + 2)];

        for (let step = 0; step < steps; step++) {
          if (index > 0 && step === 0) {
            continue;
          }

          const t = step / steps;
          const t2 = t * t;
          const t3 = t2 * t;
          result.push({
            x:
              0.5 *
              ((2 * p1.x) +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y:
              0.5 *
              ((2 * p1.y) +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
            width:
              0.5 *
              ((2 * p1.width) +
                (-p0.width + p2.width) * t +
                (2 * p0.width - 5 * p1.width + 4 * p2.width - p3.width) * t2 +
                (-p0.width + 3 * p1.width - 3 * p2.width + p3.width) * t3),
            r: p1.r,
            g: p1.g,
            b: p1.b,
            a: p1.a,
          });
        }
      }

      result.push({ ...points[points.length - 1] });
      return result;
    }

    _getDebuggerProperties() {
      return [
        {
          title: "$MeshStroke",
          properties: [
            { name: "$pointCount", value: this._points.length },
            { name: "$vertexCount", value: this._lastVertexCount },
            { name: "$lineLength", value: this._lastLineLength },
            { name: "$distortAmplitude", value: this._distortAmplitude },
            { name: "$uvScrollOffset", value: this._uvScrollOffset },
            { name: "$blendMode", value: this._blendMode },
            { name: "$meshRebuildCount", value: this._meshRebuildCount },
            { name: "$lastTickRebuilt", value: this._lastTickRebuilt },
            { name: "$renderLOD", value: this._renderLOD || "off" },
            { name: "$renderedPointCount", value: this._lastRenderedPointCount },
            { name: "$distortResolution", value: this._distortResolution },
            { name: "$isCulled", value: this._isCulled },
            { name: "$coordSpace", value: this._coordSpace },
          ],
        },
      ];
    }

    _release() {
      super._release();
    }

    _saveToJson() {
      return {
        points: this._points,
        uvScrollOffset: this._uvScrollOffset,
        distortPhase: this._distortPhase,
        distortAmplitude: this._distortAmplitude,
        distortFrequency: this._distortFrequency,
        distortSpeed: this._distortSpeed,
        uvScrollSpeed: this._uvScrollSpeed,
        textureTileLength: this._textureTileLength,
        blendMode: this._blendMode,
        endCapStyle: this._endCapStyle,
        renderLOD: this._renderLOD,
        distortResolution: this._distortResolution,
        frustumCullingEnabled: this._frustumCullingEnabled,
        coordSpace: this._coordSpace,
        opacity: this.opacity,
      };
    }

    _loadFromJson(o) {
      this._points = Array.isArray(o?.points)
        ? o.points.map((point) => ({ ...point }))
        : createInitialPoints(2, this._defaultWidth);
      this._uvScrollOffset = toFiniteNumber(o?.uvScrollOffset, 0);
      this._distortPhase = toFiniteNumber(o?.distortPhase, 0);
      this._distortAmplitude = Math.max(0, toFiniteNumber(o?.distortAmplitude, this._distortAmplitude));
      this._distortFrequency = Math.max(0, toFiniteNumber(o?.distortFrequency, this._distortFrequency));
      this._distortSpeed = toFiniteNumber(o?.distortSpeed, this._distortSpeed);
      this._uvScrollSpeed = toFiniteNumber(o?.uvScrollSpeed, this._uvScrollSpeed);
      this._textureTileLength = Math.max(0.0001, toFiniteNumber(o?.textureTileLength, this._textureTileLength));
      this._blendMode = getComboKey(o?.blendMode, BLEND_MODE_KEYS, this._blendMode);
      this._endCapStyle = getComboKey(o?.endCapStyle, END_CAP_KEYS, this._endCapStyle);
      this._renderLOD = Math.max(0, Math.floor(toFiniteNumber(o?.renderLOD, this._renderLOD)));
      this._distortResolution = Math.max(1, Math.floor(toFiniteNumber(o?.distortResolution, this._distortResolution)));
      this._frustumCullingEnabled = !!o?.frustumCullingEnabled;
      this._coordSpace = getComboKey(o?.coordSpace, COORD_SPACE_KEYS, this._coordSpace);
      this.opacity = clamp01(toFiniteNumber(o?.opacity, this.opacity));
      this._syncInstanceAppearance();
      this._markMeshDirty();
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

    MeshGetPointWidth(index) {
      return this._isValidPointIndex(this._coercePointIndex(index))
        ? this._points[this._coercePointIndex(index)].width
        : 0;
    }

    MeshGetPointR(index) {
      return colorToC3(this._points[this._coercePointIndex(index)]).r || 0;
    }

    MeshGetPointG(index) {
      return colorToC3(this._points[this._coercePointIndex(index)]).g || 0;
    }

    MeshGetPointB(index) {
      return colorToC3(this._points[this._coercePointIndex(index)]).b || 0;
    }

    MeshGetPointOpacity(index) {
      return colorToC3(this._points[this._coercePointIndex(index)]).opacity || 0;
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

    get MeshTextureTileLength() {
      return this._textureTileLength;
    }

    get MeshCoordSpace() {
      return this._coordSpace;
    }
  };
}
