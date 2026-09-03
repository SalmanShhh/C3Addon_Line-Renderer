export const config = {
  listName: "Set point Z elevation",
  displayText: "Set {my} point {0} Z elevation to {1}",
  description: "Set the Z elevation of a point.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "z", name: "Z elevation", desc: "The Z elevation of the point: relative to the object in relative space, or the layout Z elevation in absolute space.", type: "number", initialValue: "0" },
  ],
};

export const expose = true;

export default function (index, z) {
  const pointIndex = this._coercePointIndex(index);
  if (!this._isValidPointIndex(pointIndex)) {
    return;
  }

  this._points[pointIndex].z = +z || 0;
  this._markMeshDirty();
}
