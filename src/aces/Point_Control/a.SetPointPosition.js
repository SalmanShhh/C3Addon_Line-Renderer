export const config = {
  listName: "Set point position",
  displayText: "Set {my} point {0} position to ({1}, {2}, {3})",
  description: "Set the position and Z elevation of a point. Setting a point past the end adds points up to it.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "z", name: "Z elevation", desc: "The Z elevation of the point (relative to the object in relative space, layout Z elevation in absolute space).", type: "number", initialValue: "0" },
  ],
};

export const expose = true;

export default function (index, x, y, z) {
  const pointIndex = this._coercePointIndex(index);
  if (!this._ensurePointIndex(pointIndex)) {
    return;
  }
  const point = this._points[pointIndex];
  point.x = +x || 0;
  point.y = +y || 0;
  point.z = +z || 0;
  this._markMeshDirty();
}
