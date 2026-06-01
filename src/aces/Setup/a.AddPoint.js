export const config = {
  listName: "Add point",
  displayText: "Add point at ({0}, {1}) with width {2}",
  description: "Append one control point.",
  params: [
    { id: "x", name: "X", desc: "Point X.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "Point Y.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Point width.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (x, y, width) {
  this._points.push({ x: +x || 0, y: +y || 0, width: Math.max(0, +width || 0), r: 1, g: 1, b: 1, a: 1 });
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
