export const config = {
  listName: "Set point position",
  displayText: "Set point {0} position to ({1}, {2})",
  description: "Set the position of a point.",
  params: [
    { id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "Point X.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "Point Y.", type: "number", initialValue: "0" },
  ],
};

export const expose = true;

export default function (index, x, y) {
  const pointIndex = this._coercePointIndex(index);
  if (!this._isValidPointIndex(pointIndex)) {
    return;
  }

  this._points[pointIndex].x = +x || 0;
  this._points[pointIndex].y = +y || 0;
  this._markMeshDirty();
}
