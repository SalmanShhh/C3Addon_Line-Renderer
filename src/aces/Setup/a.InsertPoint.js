export const config = {
  listName: "Insert point",
  displayText: "Insert point at {0} to ({1}, {2}) with width {3}",
  description: "Insert a control point at an index.",
  params: [
    { id: "index", name: "Index", desc: "Insert index.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "Point X.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "Point Y.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Point width.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (index, x, y, width) {
  const insertAt = Math.max(0, Math.min(this._points.length, Math.floor(+index || 0)));
  this._points.splice(insertAt, 0, {
    x: +x || 0,
    y: +y || 0,
    width: Math.max(0, +width || 0),
    r: 1,
    g: 1,
    b: 1,
    a: 1,
  });
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
