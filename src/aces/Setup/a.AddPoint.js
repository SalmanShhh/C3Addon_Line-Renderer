export const config = {
  listName: "Add point",
  displayText: "Add {my} point at ({0}, {1}) with width {2}",
  description: "Add a point to the end of the line.",
  params: [
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Half the thickness of the line at this point, in pixels.", type: "number", initialValue: "16" },
  ],
};

export const expose = true;

export default function (x, y, width) {
  this._points.push(this._newPoint(x, y, width));
  this._markMeshDirty();
  this._trigger("OnPointCountChanged");
}
