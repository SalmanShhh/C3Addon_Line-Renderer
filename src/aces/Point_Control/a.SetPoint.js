export const config = {
  listName: "Set point",
  displayText: "Set point {0} to ({1}, {2}) width {3}",
  description: "Set the position and width of a point.",
  params: [
    { id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "Point X.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "Point Y.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Point width.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (index, x, y, width) {
  const pointIndex = this._coercePointIndex(index);
  if (!this._isValidPointIndex(pointIndex)) {
    return;
  }

  const point = this._points[pointIndex];
  point.x = +x || 0;
  point.y = +y || 0;
  point.width = Math.max(0, +width || 0);
  this._markMeshDirty();
}
