export const config = {
  listName: "Add point",
  displayText: "Add {my} point at ({0}, {1}, {2}) with height {3}",
  description: "Add a point to the end of the line.",
  params: [
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "z", name: "Z elevation", desc: "The Z elevation of the point (relative to the object in relative space, layout Z elevation in absolute space).", type: "number", initialValue: "0" },
    { id: "height", name: "Height", desc: "The line thickness at this point, in pixels (like the object height).", type: "number", initialValue: "32" },
  ],
};

export const expose = true;

export default function (x, y, z, height) {
  this._points.push(this._newPoint(x, y, Math.max(0, +height || 0) * 0.5, z));
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
