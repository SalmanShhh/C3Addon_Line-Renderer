export const config = {
  listName: "Set point",
  displayText: "Set {my} point {0} to ({1}, {2}) with width {3}",
  description: "Set the position and width of a point.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Half the thickness of the line at this point, in pixels.", type: "number", initialValue: "16" },
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
