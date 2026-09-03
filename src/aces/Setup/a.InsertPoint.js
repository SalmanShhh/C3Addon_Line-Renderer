export const config = {
  listName: "Insert point",
  displayText: "Insert {my} point {0} at ({1}, {2}) with width {3}",
  description: "Insert a point at an index, moving later points up by one.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index to insert at.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Half the thickness of the line at this point, in pixels.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (index, x, y, width) {
  const insertAt = Math.max(0, Math.min(this._points.length, Math.floor(+index || 0)));
  this._points.splice(insertAt, 0, this._newPoint(x, y, width));
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
