import {
  BLEND_MODE_KEYS,
  DISTORT_AXIS_KEYS,
  EDITOR_PREVIEW_KEYS,
  END_CAP_KEYS,
  SAMPLING_MODE_KEYS,
  buildStrokeMesh,
  clamp01,
  createPreviewPointsFromRect,
  getBlendModeValue,
  getComboKey,
  getSamplingValue,
  remapUvsToTexRect,
  toFiniteNumber,
} from "../shared/meshstrokeShared.js";

export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
      this._editorUvOffset = 0;
      this._editorDistortPhase = 0;
      this._previewProps = {
        textureTileLength: 64,
        uvScrollSpeed: 0,
        defaultWidth: 16,
        distortAmplitude: 0,
        distortFrequency: 1,
        distortSpeed: 1,
        distortAxis: DISTORT_AXIS_KEYS[2],
        endCapStyle: END_CAP_KEYS[0],
        blendMode: BLEND_MODE_KEYS[0],
        samplingMode: SAMPLING_MODE_KEYS[0],
        debugPoints: false,
        editorPreview: EDITOR_PREVIEW_KEYS[0],
      };
    }

    Release() {}

    OnCreate() {}

    OnPlacedInLayout() {
      this._inst.SetSize?.(160, 32);
    }

    OnPropertyChanged(id, value) {
      this._previewProps[id] = value;

      if (id === "editorPreview" && this._previewProps.editorPreview !== "animated") {
        this._editorUvOffset = 0;
        this._editorDistortPhase = 0;
      }

      this._inst.GetLayoutView?.().Refresh?.();
    }

    Draw(iRenderer, iDrawParams) {
      const rect = iDrawParams.GetLayoutRect?.();
      const preview = getComboKey(
        this._previewProps.editorPreview,
        EDITOR_PREVIEW_KEYS,
        EDITOR_PREVIEW_KEYS[0]
      );
      const defaultWidth = Math.max(0, toFiniteNumber(this._previewProps.defaultWidth, 16));
      const previewPoints = createPreviewPointsFromRect(rect, defaultWidth);

      if (preview === "wireframe") {
        this._drawWireframe(iRenderer, previewPoints);
      } else {
        const animated = preview === "animated";
        if (animated) {
          this._editorUvOffset += toFiniteNumber(this._previewProps.uvScrollSpeed, 0) / 30;
          this._editorDistortPhase += toFiniteNumber(this._previewProps.distortSpeed, 1) / 30;
        }

        const mesh = buildStrokeMesh({
          points: previewPoints,
          distortResolution: 1,
          textureTileLength: Math.max(0.0001, toFiniteNumber(this._previewProps.textureTileLength, 64)),
          uvScrollOffset: animated ? this._editorUvOffset : 0,
          distortAmplitude: animated ? Math.max(0, toFiniteNumber(this._previewProps.distortAmplitude, 0)) : 0,
          distortFrequency: Math.max(0, toFiniteNumber(this._previewProps.distortFrequency, 1)),
          distortPhase: animated ? this._editorDistortPhase : 0,
          distortAxis: getComboKey(this._previewProps.distortAxis, DISTORT_AXIS_KEYS, DISTORT_AXIS_KEYS[2]),
          endCapStyle: getComboKey(this._previewProps.endCapStyle, END_CAP_KEYS, END_CAP_KEYS[0]),
          opacity: 1,
        });
        this._drawMeshPreview(iRenderer, mesh);
        this._drawDebugPoints(iRenderer, previewPoints);

        if (animated) {
          const layoutView = iDrawParams.GetLayoutView?.() ?? this._inst.GetLayoutView?.();
          const canAnimate =
            layoutView?.IsAnimationEnabled?.() ||
            this._inst.IsSelected?.() ||
            false;
          if (canAnimate) {
            layoutView?.Refresh?.();
          }
        }
      }
    }

    _drawWireframe(iRenderer, previewPoints) {
      iRenderer.SetAlphaBlendMode?.();
      iRenderer.SetColorFillMode?.();
      iRenderer.SetColorRgba?.(0.15, 0.7, 1, 1);
      iRenderer.PushLineWidth?.(2);

      for (let index = 0; index < previewPoints.length - 1; index++) {
        const current = previewPoints[index];
        const next = previewPoints[index + 1];
        iRenderer.Line?.(current.x, current.y, next.x, next.y);
      }

      iRenderer.PopLineWidth?.();
      this._drawDebugPoints(iRenderer, previewPoints);
    }

    _drawMeshPreview(iRenderer, mesh) {
      if (!mesh.vertexCount) {
        return;
      }

      const blendMode = getBlendModeValue(
        getComboKey(this._previewProps.blendMode, BLEND_MODE_KEYS, BLEND_MODE_KEYS[0])
      );
      if (blendMode === "normal") {
        iRenderer.SetAlphaBlendMode?.();
      } else {
        iRenderer.SetBlendMode?.(blendMode);
      }

      iRenderer.SetColorFillMode?.();
      iRenderer.SetColorRgba?.(1, 1, 1, clamp01(1));
      iRenderer.DrawMesh?.(mesh.positions, mesh.uvs, mesh.indices, mesh.colors);
    }

    _drawDebugPoints(iRenderer, points) {
      if (!this._previewProps.debugPoints) {
        return;
      }

      iRenderer.SetColorFillMode?.();
      iRenderer.SetColorRgba?.(1, 0.25, 0.25, 1);
      for (const point of points) {
        iRenderer.Rect2?.(point.x - 3, point.y - 3, point.x + 3, point.y + 3);
      }
    }
  };
}
