export const config = {
  listName: "Add point with Z elevation",
  displayText: "Add {my} point at ({0}, {1}) Z elevation {2} with width {3}",
  description: "Add a point with a Z elevation to the end of the line.",
  params: [
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "z", name: "Z elevation", desc: "The Z elevation of the point: relative to the object in relative space, or the layout Z elevation in absolute space.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Half the thickness of the line at this point, in pixels.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (x, y, z, width) {
  this._points.push(this._newPoint(x, y, width, z));
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
