export const DISTORT_AXIS_KEYS = [
  "x_only",
  "y_only",
  "both",
  "perpendicular",
];

export const END_CAP_KEYS = ["round", "flat", "square"];
export const BLEND_MODE_KEYS = ["normal", "additive", "multiply", "screen"];
export const SAMPLING_MODE_KEYS = ["auto", "nearest", "linear"];
export const EDITOR_PREVIEW_KEYS = ["wireframe", "solid", "animated"];
export const COORD_SPACE_KEYS = ["absolute", "relative"];

const CAP_SEGMENTS = 8;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toCount(value, min = 2) {
  return Math.max(min, Math.floor(toFiniteNumber(value, min)));
}

export function getComboKey(value, keys, fallback = keys[0]) {
  if (typeof value === "number") {
    return keys[value] ?? fallback;
  }

  const normalized = String(value ?? "").trim();
  return keys.includes(normalized) ? normalized : fallback;
}

export function makePoint(x = 0, y = 0, width = 16) {
  return {
    x: toFiniteNumber(x, 0),
    y: toFiniteNumber(y, 0),
    width: Math.max(0, toFiniteNumber(width, 0)),
    r: 1,
    g: 1,
    b: 1,
    a: 1,
  };
}

export function clonePoint(point) {
  return {
    x: toFiniteNumber(point?.x, 0),
    y: toFiniteNumber(point?.y, 0),
    width: Math.max(0, toFiniteNumber(point?.width, 0)),
    r: clamp01(toFiniteNumber(point?.r, 1)),
    g: clamp01(toFiniteNumber(point?.g, 1)),
    b: clamp01(toFiniteNumber(point?.b, 1)),
    a: clamp01(toFiniteNumber(point?.a, 1)),
  };
}

export function createInitialPoints(count, width) {
  return Array.from({ length: toCount(count, 2) }, () => makePoint(0, 0, width));
}

export function colorFromC3(r, g, b, opacity) {
  const alpha = clamp01(toFiniteNumber(opacity, 100) / 100);
  const red = clamp01(toFiniteNumber(r, 255) / 255);
  const green = clamp01(toFiniteNumber(g, 255) / 255);
  const blue = clamp01(toFiniteNumber(b, 255) / 255);

  return {
    r: red * alpha,
    g: green * alpha,
    b: blue * alpha,
    a: alpha,
  };
}

export function colorToC3(point) {
  const alpha = clamp01(toFiniteNumber(point?.a, 0));
  if (alpha <= 0) {
    return { r: 0, g: 0, b: 0, opacity: 0 };
  }

  return {
    r: Math.round(clamp01(toFiniteNumber(point?.r, 0) / alpha) * 255),
    g: Math.round(clamp01(toFiniteNumber(point?.g, 0) / alpha) * 255),
    b: Math.round(clamp01(toFiniteNumber(point?.b, 0) / alpha) * 255),
    opacity: Math.round(alpha * 100),
  };
}

export function getBlendModeValue(key) {
  return {
    normal: "normal",
    additive: "additive",
    multiply: "multiply",
    screen: "screen",
  }[key] ?? "normal";
}

export function getSamplingValue(key) {
  return {
    auto: "auto",
    nearest: "nearest",
    linear: "bilinear",
  }[key] ?? "auto";
}

export function transformRelativePoint(point, transform) {
  const scaleX = toFiniteNumber(transform?.scaleX, 1);
  const scaleY = toFiniteNumber(transform?.scaleY, 1);
  const angle = toFiniteNumber(transform?.angle, 0);
  const originX = toFiniteNumber(transform?.x, 0);
  const originY = toFiniteNumber(transform?.y, 0);

  const localX = toFiniteNumber(point.x, 0) * scaleX;
  const localY = toFiniteNumber(point.y, 0) * scaleY;
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  return {
    x: originX + localX * cosAngle - localY * sinAngle,
    y: originY + localX * sinAngle + localY * cosAngle,
    width:
      Math.max(Math.abs(scaleX), Math.abs(scaleY)) * Math.max(0, toFiniteNumber(point.width, 0)),
    r: clamp01(toFiniteNumber(point.r, 1)),
    g: clamp01(toFiniteNumber(point.g, 1)),
    b: clamp01(toFiniteNumber(point.b, 1)),
    a: clamp01(toFiniteNumber(point.a, 1)),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lengthOf(dx, dy) {
  return Math.hypot(dx, dy);
}

function normalize(dx, dy) {
  const length = lengthOf(dx, dy);
  if (length <= 1e-6) {
    return { x: 1, y: 0 };
  }

  return {
    x: dx / length,
    y: dy / length,
  };
}

function samplePoints(points, distortResolution) {
  const resolution = Math.max(1, Math.floor(toFiniteNumber(distortResolution, 1)));
  const sampled = [];

  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];

    for (let step = 0; step < resolution; step++) {
      if (index > 0 && step === 0) {
        continue;
      }

      const t = step / resolution;
      sampled.push({
        x: lerp(current.x, next.x, t),
        y: lerp(current.y, next.y, t),
        width: lerp(current.width, next.width, t),
        r: lerp(current.r, next.r, t),
        g: lerp(current.g, next.g, t),
        b: lerp(current.b, next.b, t),
        a: lerp(current.a, next.a, t),
      });
    }
  }

  sampled.push(clonePoint(points[points.length - 1]));

  let arcLength = 0;
  for (let index = 0; index < sampled.length; index++) {
    const prev = sampled[index - 1];
    const current = sampled[index];
    const next = sampled[index + 1];

    if (prev) {
      arcLength += lengthOf(current.x - prev.x, current.y - prev.y);
    }

    const before = prev ?? current;
    const after = next ?? current;
    const tangent = normalize(after.x - before.x, after.y - before.y);

    current.arcLength = arcLength;
    current.tx = tangent.x;
    current.ty = tangent.y;
    current.nx = -tangent.y;
    current.ny = tangent.x;
  }

  return sampled;
}

function sampleRenderedPoints(points, renderLod) {
  const targetCount = Math.max(0, Math.floor(toFiniteNumber(renderLod, 0)));
  if (targetCount <= 0 || targetCount >= points.length) {
    return points.map(clonePoint);
  }

  const count = Math.max(2, targetCount);
  const sampled = [];
  let lastIndex = -1;

  for (let i = 0; i < count; i++) {
    let sourceIndex = Math.round((i * (points.length - 1)) / (count - 1));
    sourceIndex = Math.max(sourceIndex, lastIndex + 1);
    sourceIndex = Math.min(sourceIndex, points.length - (count - i));
    lastIndex = sourceIndex;
    sampled.push(clonePoint(points[sourceIndex]));
  }

  return sampled;
}

function applyDistortion(sample, options) {
  const amplitude = Math.max(0, toFiniteNumber(options.distortAmplitude, 0));
  if (amplitude <= 0) {
    return { x: 0, y: 0 };
  }

  const phase =
    toFiniteNumber(options.distortFrequency, 1) * sample.arcLength +
    toFiniteNumber(options.distortPhase, 0);
  const offset = amplitude * Math.sin(phase);
  const axis = getComboKey(options.distortAxis, DISTORT_AXIS_KEYS, DISTORT_AXIS_KEYS[2]);

  if (axis === "x_only") {
    return { x: offset, y: 0 };
  }

  if (axis === "y_only") {
    return { x: 0, y: offset };
  }

  if (axis === "perpendicular") {
    return {
      x: sample.nx * offset,
      y: sample.ny * offset,
    };
  }

  return { x: offset, y: offset };
}

function remapColor(sample, opacity, tint) {
  // Point colors are stored premultiplied (rgb already include the point alpha),
  // so master opacity scales rgb and alpha together. The optional tint scales rgb only.
  const alpha = clamp01(sample.a) * opacity;
  const tr = tint ? clamp01(toFiniteNumber(tint[0], 1)) : 1;
  const tg = tint ? clamp01(toFiniteNumber(tint[1], 1)) : 1;
  const tb = tint ? clamp01(toFiniteNumber(tint[2], 1)) : 1;
  return {
    r: clamp01(sample.r) * opacity * tr,
    g: clamp01(sample.g) * opacity * tg,
    b: clamp01(sample.b) * opacity * tb,
    a: alpha,
  };
}

function addVertex(mesh, vertex) {
  // drawMesh expects 3 components per position (x, y, z); 2D strokes use z = 0.
  mesh.positions.push(vertex.x, vertex.y, 0);
  mesh.uvs.push(vertex.u, vertex.v);
  mesh.colors.push(vertex.r, vertex.g, vertex.b, vertex.a);

  mesh.bounds.left = Math.min(mesh.bounds.left, vertex.x);
  mesh.bounds.top = Math.min(mesh.bounds.top, vertex.y);
  mesh.bounds.right = Math.max(mesh.bounds.right, vertex.x);
  mesh.bounds.bottom = Math.max(mesh.bounds.bottom, vertex.y);

  return mesh.vertexCount++;
}

function addCap(mesh, sample, radius, isStart, opacity, tint) {
  const centerColor = remapColor(sample, opacity, tint);
  const centerIndex = addVertex(mesh, {
    x: sample.x,
    y: sample.y,
    u: sample.arcLength,
    v: 0.5,
    ...centerColor,
  });

  const tangentAngle = Math.atan2(sample.ty, sample.tx);
  const normalAngle = tangentAngle + Math.PI / 2;
  const from = normalAngle;
  const to = isStart ? normalAngle + Math.PI : normalAngle - Math.PI;
  const edgeIndices = [];

  for (let step = 0; step <= CAP_SEGMENTS; step++) {
    const t = step / CAP_SEGMENTS;
    const angle = lerp(from, to, t);
    const vertexColor = remapColor(sample, opacity, tint);
    edgeIndices.push(
      addVertex(mesh, {
        x: sample.x + Math.cos(angle) * radius,
        y: sample.y + Math.sin(angle) * radius,
        u: sample.arcLength,
        v: 0.5,
        ...vertexColor,
      })
    );
  }

  for (let index = 0; index < edgeIndices.length - 1; index++) {
    mesh.indices.push(centerIndex, edgeIndices[index], edgeIndices[index + 1]);
  }
}

export function buildStrokeMesh(options) {
  const sourcePoints = Array.isArray(options?.points) ? options.points : [];
  if (sourcePoints.length < 2) {
    return {
      positions: new Float32Array(0),
      uvs: new Float32Array(0),
      colors: new Float32Array(0),
      indices: new Uint16Array(0),
      bounds: null,
      lineLength: 0,
      vertexCount: 0,
      renderedPointCount: sourcePoints.length,
    };
  }

  const transformed = sampleRenderedPoints(sourcePoints, options.renderLod).map((point) => {
    return options.relativeTransform
      ? transformRelativePoint(point, options.relativeTransform)
      : clonePoint(point);
  });

  let lineLength = 0;
  for (let index = 1; index < transformed.length; index++) {
    lineLength += lengthOf(
      transformed[index].x - transformed[index - 1].x,
      transformed[index].y - transformed[index - 1].y
    );
  }

  const stripSamples = samplePoints(transformed, options.distortResolution);
  if (stripSamples.length < 2) {
    return {
      positions: new Float32Array(0),
      uvs: new Float32Array(0),
      colors: new Float32Array(0),
      indices: new Uint16Array(0),
      bounds: null,
      lineLength,
      vertexCount: 0,
      renderedPointCount: transformed.length,
    };
  }

  const capStyle = getComboKey(options.endCapStyle, END_CAP_KEYS, END_CAP_KEYS[0]);
  const mesh = {
    positions: [],
    uvs: [],
    colors: [],
    indices: [],
    bounds: {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
    },
    vertexCount: 0,
  };

  const opacity = clamp01(toFiniteNumber(options.opacity, 1));
  const tint = Array.isArray(options.tint) ? options.tint : null;
  const stripIndices = [];
  const workingSamples = stripSamples.map((sample) => ({ ...sample }));

  if (capStyle === "square") {
    const first = workingSamples[0];
    const last = workingSamples[workingSamples.length - 1];
    workingSamples.unshift({
      ...first,
      x: first.x - first.tx * first.width,
      y: first.y - first.ty * first.width,
    });
    workingSamples.push({
      ...last,
      x: last.x + last.tx * last.width,
      y: last.y + last.ty * last.width,
    });
  }

  const tileLength = Math.max(0.0001, toFiniteNumber(options.textureTileLength, 64));
  const uvOffset = toFiniteNumber(options.uvScrollOffset, 0) / tileLength;

  for (const sample of workingSamples) {
    const distortion = applyDistortion(sample, options);
    const color = remapColor(sample, opacity, tint);
    const width = Math.max(0, sample.width);
    const u = sample.arcLength / tileLength + uvOffset;

    const leftIndex = addVertex(mesh, {
      x: sample.x + sample.nx * width + distortion.x,
      y: sample.y + sample.ny * width + distortion.y,
      u,
      v: 0,
      ...color,
    });
    const rightIndex = addVertex(mesh, {
      x: sample.x - sample.nx * width + distortion.x,
      y: sample.y - sample.ny * width + distortion.y,
      u,
      v: 1,
      ...color,
    });

    stripIndices.push(leftIndex, rightIndex);
  }

  for (let index = 0; index < stripIndices.length - 2; index += 2) {
    const left = stripIndices[index];
    const right = stripIndices[index + 1];
    const nextLeft = stripIndices[index + 2];
    const nextRight = stripIndices[index + 3];
    mesh.indices.push(left, right, nextLeft, right, nextRight, nextLeft);
  }

  if (capStyle === "round") {
    addCap(mesh, stripSamples[0], stripSamples[0].width, true, opacity, tint);
    addCap(mesh, stripSamples[stripSamples.length - 1], stripSamples[stripSamples.length - 1].width, false, opacity, tint);
  }

  const bounds = mesh.vertexCount
    ? mesh.bounds
    : null;

  return {
    positions: new Float32Array(mesh.positions),
    uvs: new Float32Array(mesh.uvs),
    colors: new Float32Array(mesh.colors),
    indices: new Uint16Array(mesh.indices),
    bounds,
    lineLength,
    vertexCount: mesh.vertexCount,
    renderedPointCount: transformed.length,
  };
}

export function createPreviewPointsFromRect(rect, width) {
  const left = toFiniteNumber(rect?.getLeft?.() ?? rect?.left, -64);
  const top = toFiniteNumber(rect?.getTop?.() ?? rect?.top, -8);
  const right = toFiniteNumber(rect?.getRight?.() ?? rect?.right, 64);
  const bottom = toFiniteNumber(rect?.getBottom?.() ?? rect?.bottom, 8);
  const midY = (top + bottom) * 0.5;
  const thickness = Math.abs(bottom - top) * 0.5;

  return [
    makePoint(left, midY, thickness > 0 ? thickness : width),
    makePoint(right, midY, thickness > 0 ? thickness : width),
  ];
}

// Build a 2-point preview stroke from the instance's layout-space quad so the
// editor preview tracks the instance position, rotation, size and scene-graph
// parent transform (GetQuad() already returns final hierarchy-transformed coords).
export function createPreviewPointsFromQuad(quad, fallbackWidth) {
  if (!quad) {
    return null;
  }

  const read = (name) =>
    typeof quad[name] === "function" ? toFiniteNumber(quad[name](), NaN) : NaN;
  const tlx = read("getTlx");
  const tly = read("getTly");
  const trx = read("getTrx");
  const try_ = read("getTry");
  const brx = read("getBrx");
  const bry = read("getBry");
  const blx = read("getBlx");
  const bly = read("getBly");

  if (![tlx, tly, trx, try_, brx, bry, blx, bly].every(Number.isFinite)) {
    return null;
  }

  const leftX = (tlx + blx) * 0.5;
  const leftY = (tly + bly) * 0.5;
  const rightX = (trx + brx) * 0.5;
  const rightY = (try_ + bry) * 0.5;
  const leftEdge = lengthOf(blx - tlx, bly - tly);
  const thickness = leftEdge > 0 ? leftEdge * 0.5 : Math.max(0, toFiniteNumber(fallbackWidth, 0));

  return [
    makePoint(leftX, leftY, thickness),
    makePoint(rightX, rightY, thickness),
  ];
}

export function remapUvsToTexRect(uvs, texRect) {
  if (!texRect || !uvs?.length) {
    return uvs;
  }

  const left = toFiniteNumber(texRect.getLeft?.() ?? texRect.left, 0);
  const top = toFiniteNumber(texRect.getTop?.() ?? texRect.top, 0);
  const right = toFiniteNumber(texRect.getRight?.() ?? texRect.right, 1);
  const bottom = toFiniteNumber(texRect.getBottom?.() ?? texRect.bottom, 1);
  const width = right - left;
  const height = bottom - top;
  const remapped = new Float32Array(uvs.length);

  // Linear remap into the source tex rect. U may exceed [0,1] when the stroke is
  // longer than one tile; tiling relies on the texture's repeat wrap mode
  // (enabled because the addon sets IsTiled, so the image is not sprite-sheeted).
  for (let index = 0; index < uvs.length; index += 2) {
    remapped[index] = left + uvs[index] * width;
    remapped[index + 1] = top + uvs[index + 1] * height;
  }

  return remapped;
}