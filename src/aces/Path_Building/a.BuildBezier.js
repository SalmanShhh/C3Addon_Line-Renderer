export const config = {
  listName: "Set bezier curve",
  displayText: "Set {my} bezier curve from ({0}, {1}) via ({2}, {3}) and ({4}, {5}) to ({6}, {7}) with {8} segments",
  description: "Replace all points with a cubic bezier curve.",
  params: [
    { id: "x1", name: "Start X", desc: "The X co-ordinate of the start of the curve.", type: "number", initialValue: "0" },
    { id: "y1", name: "Start Y", desc: "The Y co-ordinate of the start of the curve.", type: "number", initialValue: "0" },
    { id: "c1x", name: "Control 1 X", desc: "The X co-ordinate of the first control point.", type: "number", initialValue: "64" },
    { id: "c1y", name: "Control 1 Y", desc: "The Y co-ordinate of the first control point.", type: "number", initialValue: "-32" },
    { id: "c2x", name: "Control 2 X", desc: "The X co-ordinate of the second control point.", type: "number", initialValue: "128" },
    { id: "c2y", name: "Control 2 Y", desc: "The Y co-ordinate of the second control point.", type: "number", initialValue: "32" },
    { id: "x2", name: "End X", desc: "The X co-ordinate of the end of the curve.", type: "number", initialValue: "192" },
    { id: "y2", name: "End Y", desc: "The Y co-ordinate of the end of the curve.", type: "number", initialValue: "0" },
    { id: "segments", name: "Segments", desc: "The number of straight segments used for the curve.", type: "number", initialValue: "8" },
  ],
};

export const expose = true;

export default function (x1, y1, c1x, c1y, c2x, c2y, x2, y2, segments) {
  this._replacePoints(this._buildBezierPoints(x1, y1, c1x, c1y, c2x, c2y, x2, y2, segments));
}
