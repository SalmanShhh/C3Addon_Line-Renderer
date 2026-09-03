export const config = {
  listName: "Remove point",
  displayText: "Remove {my} point {0}",
  description: "Remove the point at an index. A line always keeps at least two points.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point to remove.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (index) {
  const pointIndex = this._coercePointIndex(index);
  if (!this._isValidPointIndex(pointIndex) || this._points.length <= 2) {
    return;
  }

  this._points.splice(pointIndex, 1);
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
