export const config = {
  listName: "Set point position",
  displayText: "Set {my} point {0} position to ({1}, {2})",
  description: "Set the position of a point.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
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
