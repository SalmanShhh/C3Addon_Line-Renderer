export const config = {
  listName: "Insert point",
  displayText: "Insert {my} point {0} at ({1}, {2}, {3}) with height {4}",
  description: "Insert a point at an index, moving later points up by one.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index to insert at.", type: "number", initialValue: "0" },
    { id: "x", name: "X", desc: "The X co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y co-ordinate of the point.", type: "number", initialValue: "0" },
    { id: "z", name: "Z elevation", desc: "The Z elevation of the point (relative to the object in relative space, layout Z elevation in absolute space).", type: "number", initialValue: "0" },
    { id: "height", name: "Height", desc: "The line thickness at this point, in pixels (like the object height).", type: "number", initialValue: "32" },
  ],
};

export const expose = true;

export default function (index, x, y, z, height) {
  this._insertPointAt(Math.floor(+index || 0), this._newPoint(x, y, Math.max(0, +height || 0) * 0.5, z));
}
