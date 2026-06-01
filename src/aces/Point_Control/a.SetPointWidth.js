export const config = {
  listName: "Set point width",
  displayText: "Set point {0} width to {1}",
  description: "Set the width of a point.",
  params: [
    { id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Point width.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (index, width) {
  const pointIndex = this._coercePointIndex(index);
  if (!this._isValidPointIndex(pointIndex)) {
    return;
  }

  this._points[pointIndex].width = Math.max(0, +width || 0);
  this._markMeshDirty();
}
