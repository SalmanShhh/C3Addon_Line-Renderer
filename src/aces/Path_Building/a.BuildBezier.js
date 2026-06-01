export const config = {
  listName: "Build bezier",
  displayText: "Build bezier from ({0}, {1}) via ({2}, {3}) and ({4}, {5}) to ({6}, {7}) with {8} segments",
  description: "Sample a cubic bezier into control points.",
  params: [
    { id: "x1", name: "X1", desc: "Start X.", type: "number", initialValue: "0" },
    { id: "y1", name: "Y1", desc: "Start Y.", type: "number", initialValue: "0" },
    { id: "c1x", name: "C1 X", desc: "Control 1 X.", type: "number", initialValue: "64" },
    { id: "c1y", name: "C1 Y", desc: "Control 1 Y.", type: "number", initialValue: "-32" },
    { id: "c2x", name: "C2 X", desc: "Control 2 X.", type: "number", initialValue: "128" },
    { id: "c2y", name: "C2 Y", desc: "Control 2 Y.", type: "number", initialValue: "32" },
    { id: "x2", name: "X2", desc: "End X.", type: "number", initialValue: "192" },
    { id: "y2", name: "Y2", desc: "End Y.", type: "number", initialValue: "0" },
    { id: "segments", name: "Segments", desc: "Segment count.", type: "number", initialValue: "8" },
  ],
};

export const expose = true;

export default function (x1, y1, c1x, c1y, c2x, c2y, x2, y2, segments) {
  this._replacePoints(this._buildBezierPoints(x1, y1, c1x, c1y, c2x, c2y, x2, y2, segments));
}
