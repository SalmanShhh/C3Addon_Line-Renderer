// Shared stroke geometry for the Line Renderer behavior.
//
// A behavior cannot draw anything itself: it renders by writing the host
// object's mesh distortion grid (createMesh / setMeshPoint). A stroke is
// therefore built as a list of COLUMNS, one per sample along the path, each
// holding a left and a right vertex in layout (world) space. The runtime maps
// those columns onto an N x 2 host mesh (columns = samples, rows = sides).

// Order matters: combo properties/ACEs map their item index into this array, so
// new axes must be appended at the END to keep existing indices stable.
export const DISTORT_AXIS_KEYS = [
  "x_only",
  "y_only",
  "both",
  "perpendicular",
  "z_only",
];

export const END_CAP_KEYS = ["round", "flat", "square"];
export const COORD_SPACE_KEYS = ["absolute", "relative"];

// How the ribbon's width axis is oriented in 3D space:
// - flat:      width axis stays in the layout XY plane (2D behaviour; also
//              correct for Z-elevated flat ribbons).
// - billboard: width axis faces the 3D camera (needs a camera position; falls
//              back to the default view direction when none is available).
// - up_vector: width axis is perpendicular to the tangent and a world up vector
//              (0,0,1), a flat "tape" that twists as the curve turns in 3D.
export const RIBBON_FACING_KEYS = ["flat", "billboard", "up_vector"];

// How corners between segments are built:
// - simple: one column on the corner bisector at the nominal width (corners get
//           thinner as they sharpen; cheapest).
// - miter:  one column on the bisector stretched to the edges' intersection
//           point; beyond MITER_LIMIT it falls back to bevel.
// - bevel:  two columns; the outer edge is chipped flat, the inner vertices
//           share the inner intersection point so nothing overlaps.
// - round:  several columns sweeping the outer vertex around the corner.
export const JOIN_STYLE_KEYS = ["simple", "miter", "bevel", "round"];

// Extra mesh columns emitted per round end cap (quarter-circle steps).
export const ROUND_CAP_COLUMNS = 4;
// Round joins use this many arc steps per quarter turn (min 1, max at 180°).
const ROUND_JOIN_STEPS_PER_QUARTER = 4;
const ROUND_JOIN_MAX_STEPS = ROUND_JOIN_STEPS_PER_QUARTER * 2;
// Miter length limit as a multiple of the half-width (miter -> bevel fallback,
// and the cap on how far the inner vertex may slide toward the corner).
const MITER_LIMIT = 4;
// Turns below this angle (radians) are treated as straight.
const JOIN_EPSILON = 1e-3;
const DEFAULT_UP = { x: 0, y: 0, z: 1 };

// Worst-case extra columns one interior corner can add for a join style.
export function maxJoinExtraColumns(joinStyle) {
  const style = getComboKey(joinStyle, JOIN_STYLE_KEYS, JOIN_STYLE_KEYS[0]);
  if (style === "round") {
    return ROUND_JOIN_MAX_STEPS;
  }
  if (style === "bevel" || style === "miter") {
    return 1;
  }
  return 0;
}

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

// A control point: position (x, y, z) and half-thickness `width`.
export function makePoint(x = 0, y = 0, width = 16, z = 0) {
  return {
    x: toFiniteNumber(x, 0),
    y: toFiniteNumber(y, 0),
    z: toFiniteNumber(z, 0),
    width: Math.max(0, toFiniteNumber(width, 0)),
  };
}

export function clonePoint(point) {
  return makePoint(point?.x, point?.y, point?.width, point?.z);
}

export function createInitialPoints(count, width) {
  return Array.from({ length: toCount(count, 2) }, () => makePoint(0, 0, width));
}

// Seed control points as a horizontal ribbon spanning the host object's box in
// LOCAL (origin-relative) pixels, so a freshly added behavior renders the host
// exactly across its bounding box (it looks unchanged until points are
// edited). Points run along the box's vertical centre line from the left edge
// to the right edge. Point width is half the box height so the +/-width ribbon
// fills the box vertically. Z defaults to 0 (flat).
export function createBoxSpanningPoints(count, width, height, originX, originY, fallbackWidth = 16) {
  const n = toCount(count, 2);
  const w = toFiniteNumber(width, 0);
  const h = toFiniteNumber(height, 0);
  const ox = clamp01(toFiniteNumber(originX, 0.5));
  const oy = clamp01(toFiniteNumber(originY, 0.5));

  const leftX = -ox * w;
  const rightX = (1 - ox) * w;
  const midY = (0.5 - oy) * h;
  const halfThickness =
    Math.abs(h) > 0 ? Math.abs(h) * 0.5 : Math.max(0, toFiniteNumber(fallbackWidth, 16));

  return Array.from({ length: n }, (_unused, index) => {
    const t = n > 1 ? index / (n - 1) : 0;
    return makePoint(leftX + (rightX - leftX) * t, midY, halfThickness, 0);
  });
}

// Transform a local-space point into layout space using the host transform.
// The host angle is a yaw about the Z axis (rotates the XY plane), so the local
// Z offset passes through unchanged; baseZ (the host's absolute Z elevation) is
// applied later in the column builder, not here.
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
    z: toFiniteNumber(point.z, 0),
    width:
      Math.max(Math.abs(scaleX), Math.abs(scaleY)) * Math.max(0, toFiniteNumber(point.width, 0)),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function length3(dx, dy, dz) {
  return Math.hypot(dx, dy, dz);
}

function cross3(ax, ay, az, bx, by, bz) {
  return {
    x: ay * bz - az * by,
    y: az * bx - ax * bz,
    z: ax * by - ay * bx,
  };
}

function normalize3(v) {
  const length = Math.hypot(v.x, v.y, v.z);
  if (length <= 1e-6) {
    return null;
  }
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function dot3(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function scale3(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function add3(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function directionBetween(a, b) {
  return normalize3({ x: b.x - a.x, y: b.y - a.y, z: (b.z ?? 0) - (a.z ?? 0) });
}

// Width axis used for the flat ribbon: perpendicular to the tangent's
// projection onto the XY plane.
function flatWidthAxis(tx, ty) {
  const length = Math.hypot(tx, ty);
  if (length <= 1e-6) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: -ty / length, y: tx / length, z: 0 };
}

// Compute the unit width axis at a sample for the chosen ribbon orientation.
function computeWidthAxis(sample, orientation, up, cameraPosition, baseZ) {
  const tx = sample.tx;
  const ty = sample.ty;
  const tz = sample.tz;

  if (orientation === "billboard") {
    let vx = 0;
    let vy = 0;
    let vz = 1;
    if (cameraPosition) {
      vx = cameraPosition[0] - sample.x;
      vy = cameraPosition[1] - sample.y;
      vz = cameraPosition[2] - (baseZ + sample.z);
    }
    return normalize3(cross3(tx, ty, tz, vx, vy, vz)) ?? flatWidthAxis(tx, ty);
  }

  if (orientation === "up_vector") {
    return (
      normalize3(cross3(tx, ty, tz, up.x, up.y, up.z)) ??
      normalize3(cross3(tx, ty, tz, 0, 1, 0)) ?? { x: 1, y: 0, z: 0 }
    );
  }

  return flatWidthAxis(tx, ty);
}

function normalizeOrZero(dx, dy, dz) {
  return normalize3({ x: dx, y: dy, z: dz }) ?? { x: 1, y: 0, z: 0 };
}

// Subdivide the polyline and annotate every sample with its arc length and unit
// tangent (central difference).
function samplePoints(points, distortResolution) {
  const resolution = Math.max(1, Math.floor(toFiniteNumber(distortResolution, 1)));
  const sampled = [];

  // Each segment emits t in [0, 1): its own start point plus the interior
  // subdivisions. The next segment's t = 0 is the shared control point, and the
  // final control point is appended after the loop, so nothing is duplicated
  // and every control point is passed through exactly.
  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];

    for (let step = 0; step < resolution; step++) {
      const t = step / resolution;
      sampled.push({
        x: lerp(current.x, next.x, t),
        y: lerp(current.y, next.y, t),
        z: lerp(current.z ?? 0, next.z ?? 0, t),
        width: lerp(current.width, next.width, t),
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
      arcLength += length3(current.x - prev.x, current.y - prev.y, current.z - prev.z);
    }

    const before = prev ?? current;
    const after = next ?? current;
    const tangent = normalizeOrZero(after.x - before.x, after.y - before.y, after.z - before.z);

    current.arcLength = arcLength;
    current.tx = tangent.x;
    current.ty = tangent.y;
    current.tz = tangent.z;
  }

  return sampled;
}

// Render LOD: cap the number of control points used for the mesh by picking an
// evenly spread subset (always keeping the first and last point).
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

// Distortion offset is a 3D vector. The perpendicular axis uses the ribbon's
// current width axis (already 3D), so distortion bends the stroke sideways even
// when it twists through 3D space.
function applyDistortion(sample, options, widthAxis) {
  const amplitude = Math.max(0, toFiniteNumber(options.distortAmplitude, 0));
  if (amplitude <= 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const phase =
    toFiniteNumber(options.distortFrequency, 1) * sample.arcLength +
    toFiniteNumber(options.distortPhase, 0);
  const offset = amplitude * Math.sin(phase);
  const axis = getComboKey(options.distortAxis, DISTORT_AXIS_KEYS, "both");

  if (axis === "x_only") {
    return { x: offset, y: 0, z: 0 };
  }

  if (axis === "y_only") {
    return { x: 0, y: offset, z: 0 };
  }

  if (axis === "z_only") {
    return { x: 0, y: 0, z: offset };
  }

  if (axis === "perpendicular") {
    return {
      x: widthAxis.x * offset,
      y: widthAxis.y * offset,
      z: widthAxis.z * offset,
    };
  }

  return { x: offset, y: offset, z: 0 };
}

function emptyStroke(sourceCount, lineLength = 0, crossSection = 2) {
  const section = Math.max(2, Math.floor(toFiniteNumber(crossSection, 2)));
  return {
    columns: [],
    rows: section > 2 ? section + 1 : 2,
    crossSection: section,
    lineLength,
    arcMin: 0,
    arcMax: 0,
    vertexCount: 0,
    renderedPointCount: sourceCount,
    bounds: null,
    minZ: 0,
    maxZ: 0,
  };
}

// Mesh rows needed for a cross-section point count (2 = flat ribbon, >2 = tube
// with the seam vertex duplicated).
export function rowsForCrossSection(crossSection) {
  const section = Math.max(2, Math.floor(toFiniteNumber(crossSection, 2)));
  return section > 2 ? section + 1 : 2;
}

// Upper bound on the mesh columns a stroke can produce for a given number of
// rendered control points, subdivision count, cap style and join style. Used to
// keep the host mesh under a vertex budget. Subdivided samples inside a segment
// are collinear, so only the (n - 2) interior control points can add join
// columns.
export function estimateColumnCount(pointCount, distortResolution, endCapStyle, joinStyle) {
  const n = Math.max(0, Math.floor(toFiniteNumber(pointCount, 0)));
  if (n < 2) {
    return 0;
  }
  const resolution = Math.max(1, Math.floor(toFiniteNumber(distortResolution, 1)));
  const capStyle = getComboKey(endCapStyle, END_CAP_KEYS, END_CAP_KEYS[0]);
  const capColumns = capStyle === "round" ? ROUND_CAP_COLUMNS * 2 : capStyle === "square" ? 2 : 0;
  const joinColumns = Math.max(0, n - 2) * maxJoinExtraColumns(joinStyle);
  return (n - 1) * resolution + 1 + capColumns + joinColumns;
}

// Build the stroke as a list of columns in layout space.
//
// options:
//   points            control points (x, y, z, width)
//   renderLod         max control points used (0 = all)
//   distortResolution subdivisions per segment
//   distortAmplitude / distortFrequency / distortPhase / distortAxis
//   endCapStyle       round | flat | square
//   joinStyle         simple | miter | bevel | round (tubes force simple)
//   crossSection      2 = flat ribbon, >2 = tube with that many ring points
//   ribbonFacing      flat | billboard | up_vector
//   baseZ             host absolute Z elevation (added to every vertex Z)
//   cameraPosition    [x, y, z] for billboard facing, or null
//   relativeTransform {x, y, angle, scaleX, scaleY} to map local points to
//                     layout space, or null when points are already absolute
//
// Result:
//   columns[]           { lx, ly, lz, rx, ry, rz, arcLength, dx, dy, dz, ring }
//                       (layout space; see columnVertex())
//   rows / crossSection mesh rows per column and ring point count
//   lineLength          length of the (LOD-reduced) polyline
//   arcMin / arcMax     arc-length range covered by the columns (incl. caps)
//   vertexCount         rows * columns.length
//   renderedPointCount  control points used after LOD
//   bounds              axis-aligned XY bounds of all vertices, or null
//   minZ / maxZ         layout Z range of all vertices
export function buildStrokeColumns(options) {
  const sourcePoints = Array.isArray(options?.points) ? options.points : [];
  if (sourcePoints.length < 2) {
    return emptyStroke(sourcePoints.length, 0, options?.crossSection);
  }

  const transformed = sampleRenderedPoints(sourcePoints, options.renderLod).map((point) => {
    return options.relativeTransform
      ? transformRelativePoint(point, options.relativeTransform)
      : clonePoint(point);
  });

  let lineLength = 0;
  for (let index = 1; index < transformed.length; index++) {
    lineLength += length3(
      transformed[index].x - transformed[index - 1].x,
      transformed[index].y - transformed[index - 1].y,
      transformed[index].z - transformed[index - 1].z
    );
  }

  const samples = samplePoints(transformed, options.distortResolution);
  if (samples.length < 2) {
    return emptyStroke(transformed.length, lineLength, options.crossSection);
  }

  const capStyle = getComboKey(options.endCapStyle, END_CAP_KEYS, END_CAP_KEYS[0]);
  const joinStyle = getComboKey(options.joinStyle, JOIN_STYLE_KEYS, JOIN_STYLE_KEYS[0]);
  const orientation = getComboKey(options.ribbonFacing, RIBBON_FACING_KEYS, RIBBON_FACING_KEYS[0]);
  const up = options.upVector ?? DEFAULT_UP;
  const cameraPosition = Array.isArray(options.cameraPosition) ? options.cameraPosition : null;
  const baseZ = toFiniteNumber(options.baseZ, 0);

  const working = samples.map((sample) => ({ ...sample }));

  if (capStyle === "square") {
    const first = working[0];
    const last = working[working.length - 1];
    working.unshift({
      ...first,
      x: first.x - first.tx * first.width,
      y: first.y - first.ty * first.width,
      z: first.z - first.tz * first.width,
      arcLength: first.arcLength - first.width,
    });
    working.push({
      ...last,
      x: last.x + last.tx * last.width,
      y: last.y + last.ty * last.width,
      z: last.z + last.tz * last.width,
      arcLength: last.arcLength + last.width,
    });
  }

  const columns = [];
  const bounds = {
    left: Number.POSITIVE_INFINITY,
    top: Number.POSITIVE_INFINITY,
    right: Number.NEGATIVE_INFINITY,
    bottom: Number.NEGATIVE_INFINITY,
  };
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  const crossSection = Math.max(2, Math.floor(toFiniteNumber(options.crossSection, 2)));

  const tube = crossSection > 2;

  // Row 0 ("left") is the +widthAxis side, row 1 ("right") the -widthAxis side.
  // `ring` (optional) describes the column as centre + width axis + binormal +
  // radius so a tube cross-section can be generated around it; explicit join
  // columns (bevel/round) have no ring and only exist for 2-row ribbons.
  const addColumnPoints = (left, right, distortion, arcLength, ring = null) => {
    const lx = left.x + distortion.x;
    const ly = left.y + distortion.y;
    const lz = left.z + distortion.z;
    const rx = right.x + distortion.x;
    const ry = right.y + distortion.y;
    const rz = right.z + distortion.z;

    bounds.left = Math.min(bounds.left, lx, rx);
    bounds.top = Math.min(bounds.top, ly, ry);
    bounds.right = Math.max(bounds.right, lx, rx);
    bounds.bottom = Math.max(bounds.bottom, ly, ry);

    if (ring && tube) {
      minZ = Math.min(minZ, ring.cz - ring.radius + distortion.z);
      maxZ = Math.max(maxZ, ring.cz + ring.radius + distortion.z);
      {
        // A tube reaches `radius` in every direction around its centre.
        const cx = ring.cx + distortion.x;
        const cy = ring.cy + distortion.y;
        bounds.left = Math.min(bounds.left, cx - ring.radius);
        bounds.top = Math.min(bounds.top, cy - ring.radius);
        bounds.right = Math.max(bounds.right, cx + ring.radius);
        bounds.bottom = Math.max(bounds.bottom, cy + ring.radius);
      }
    } else {
      minZ = Math.min(minZ, lz, rz);
      maxZ = Math.max(maxZ, lz, rz);
    }

    columns.push({
      lx, ly, lz, rx, ry, rz, arcLength,
      dx: distortion.x, dy: distortion.y, dz: distortion.z,
      ring,
    });
  };

  // Regular column: centre, width axis W and the tangent T give the binormal
  // B = T x W, so a ring around the centre can be generated for tubes.
  const addColumn = (cx, cy, cz, tangent, widthAxis, distortion, halfWidth, arcLength) => {
    const w = Math.max(0, halfWidth);
    const center = { x: cx, y: cy, z: cz };
    const binormal =
      normalize3(cross3(tangent.x, tangent.y, tangent.z, widthAxis.x, widthAxis.y, widthAxis.z)) ??
      DEFAULT_UP;
    addColumnPoints(
      add3(center, scale3(widthAxis, w)),
      add3(center, scale3(widthAxis, -w)),
      distortion,
      arcLength,
      {
        cx, cy, cz,
        wx: widthAxis.x, wy: widthAxis.y, wz: widthAxis.z,
        bx: binormal.x, by: binormal.y, bz: binormal.z,
        radius: w,
      }
    );
  };

  // Emit the column(s) for one interior sample according to the join style.
  // Straight samples (and the simple style) produce the single bisector column.
  const addJoin = (sample, prev, next) => {
    const straightAxis = computeWidthAxis(sample, orientation, up, cameraPosition, baseZ);
    const centerZ = baseZ + sample.z;
    const center = { x: sample.x, y: sample.y, z: centerZ };
    const w = Math.max(0, sample.width);
    const dirIn = prev ? directionBetween(prev, sample) : null;
    const dirOut = next ? directionBetween(sample, next) : null;

    const tangent = { x: sample.tx, y: sample.ty, z: sample.tz };
    const fallback = () => {
      addColumn(
        sample.x,
        sample.y,
        centerZ,
        tangent,
        straightAxis,
        applyDistortion(sample, options, straightAxis),
        w,
        sample.arcLength
      );
    };

    // Tubes always use the simple (bisector) join: their ring needs a centre.
    if (joinStyle === "simple" || tube || !dirIn || !dirOut || w <= 0) {
      fallback();
      return;
    }

    const turn = Math.acos(clamp(dot3(dirIn, dirOut), -1, 1));
    if (turn < JOIN_EPSILON) {
      fallback();
      return;
    }

    // Width axes of the incoming and outgoing segments at this corner.
    const axisIn = computeWidthAxis(
      { ...sample, tx: dirIn.x, ty: dirIn.y, tz: dirIn.z },
      orientation, up, cameraPosition, baseZ
    );
    const axisOut = computeWidthAxis(
      { ...sample, tx: dirOut.x, ty: dirOut.y, tz: dirOut.z },
      orientation, up, cameraPosition, baseZ
    );
    const bisector = normalize3(add3(axisIn, axisOut));
    const cosHalf = bisector ? dot3(bisector, axisIn) : 0;
    if (!bisector || cosHalf <= 1e-3) {
      // ~180° reversal: no meaningful corner geometry.
      fallback();
      return;
    }

    const distortion = applyDistortion(sample, options, bisector);
    const miterLength = w / cosHalf;
    const limit = MITER_LIMIT * w;
    let style = joinStyle;
    if (style === "miter" && miterLength > limit) {
      style = "bevel";
    }

    if (style === "miter") {
      addColumn(sample.x, sample.y, centerZ, tangent, bisector, distortion, miterLength, sample.arcLength);
      return;
    }

    // The inner side is the one the path turns toward: where the incoming
    // width axis points along the outgoing direction.
    const innerIsLeft = dot3(axisIn, dirOut) > 0;
    const innerSign = innerIsLeft ? 1 : -1;
    const outerSign = -innerSign;
    const innerPoint = add3(center, scale3(bisector, innerSign * Math.min(miterLength, limit)));

    const outerOffsets = [];
    if (style === "round") {
      const steps = clamp(
        Math.round((turn / (Math.PI / 2)) * ROUND_JOIN_STEPS_PER_QUARTER),
        1,
        ROUND_JOIN_MAX_STEPS
      );
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const swept = normalize3({
          x: axisIn.x * (1 - t) + axisOut.x * t,
          y: axisIn.y * (1 - t) + axisOut.y * t,
          z: axisIn.z * (1 - t) + axisOut.z * t,
        }) ?? bisector;
        outerOffsets.push(scale3(swept, outerSign * w));
      }
    } else {
      outerOffsets.push(scale3(axisIn, outerSign * w), scale3(axisOut, outerSign * w));
    }

    for (const offset of outerOffsets) {
      const outerPoint = add3(center, offset);
      addColumnPoints(
        innerIsLeft ? innerPoint : outerPoint,
        innerIsLeft ? outerPoint : innerPoint,
        distortion,
        sample.arcLength
      );
    }
  };

  // Round caps are approximated with a few extra columns whose half-width
  // shrinks along a quarter circle, ending in a degenerate (zero-width) tip
  // column. This keeps the whole stroke a regular N x 2 grid.
  const addRoundCap = (sample, isStart) => {
    const widthAxis = computeWidthAxis(sample, orientation, up, cameraPosition, baseZ);
    const distortion = applyDistortion(sample, options, widthAxis);
    const radius = Math.max(0, sample.width);
    const direction = isStart ? -1 : 1;
    const centerZ = baseZ + sample.z;

    for (let step = 1; step <= ROUND_CAP_COLUMNS; step++) {
      // Start caps are emitted tip-first so columns stay ordered along the path.
      const k = isStart ? ROUND_CAP_COLUMNS + 1 - step : step;
      const theta = (k / ROUND_CAP_COLUMNS) * (Math.PI / 2);
      const along = Math.sin(theta) * radius * direction;
      addColumn(
        sample.x + sample.tx * along,
        sample.y + sample.ty * along,
        centerZ + sample.tz * along,
        { x: sample.tx, y: sample.ty, z: sample.tz },
        widthAxis,
        distortion,
        Math.cos(theta) * radius,
        sample.arcLength + along
      );
    }
  };

  if (capStyle === "round") {
    addRoundCap(working[0], true);
  }

  for (let index = 0; index < working.length; index++) {
    addJoin(working[index], working[index - 1] ?? null, working[index + 1] ?? null);
  }

  if (capStyle === "round") {
    addRoundCap(working[working.length - 1], false);
  }

  const rows = tube ? crossSection + 1 : 2;
  return {
    columns,
    rows,
    crossSection,
    lineLength,
    arcMin: columns[0].arcLength,
    arcMax: columns[columns.length - 1].arcLength,
    vertexCount: columns.length * rows,
    renderedPointCount: transformed.length,
    bounds: columns.length ? bounds : null,
    minZ: columns.length ? minZ : 0,
    maxZ: columns.length ? maxZ : 0,
  };
}

// Position of one mesh vertex for a column and row. Ribbons (rows = 2) use the
// explicit left/right points. Tubes generate a ring of `crossSection` points
// around the column centre (row `crossSection` repeats row 0 to close the seam
// with its own texture coordinate). Returns { x, y, z, v01 } with v01 in [0,1].
export function columnVertex(column, row, rows, crossSection) {
  if (rows <= 2 || !column.ring) {
    return row === 0
      ? { x: column.lx, y: column.ly, z: column.lz, v01: 0 }
      : { x: column.rx, y: column.ry, z: column.rz, v01: 1 };
  }

  const ring = column.ring;
  const t = row / crossSection;
  const angle = t * Math.PI * 2;
  const cosA = Math.cos(angle) * ring.radius;
  const sinA = Math.sin(angle) * ring.radius;
  return {
    x: ring.cx + ring.wx * cosA + ring.bx * sinA + column.dx,
    y: ring.cy + ring.wy * cosA + ring.by * sinA + column.dy,
    z: ring.cz + ring.wz * cosA + ring.bz * sinA + column.dz,
    v01: t,
  };
}
