export const config = {
  listName: "Remove point",
  displayText: "Remove point {0}",
  description: "Remove a control point.",
  params: [{ id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" }],
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
