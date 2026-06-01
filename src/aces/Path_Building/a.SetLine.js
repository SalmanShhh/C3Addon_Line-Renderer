export const config = {
  listName: "Set line",
  displayText: "Set line from ({0}, {1}) to ({2}, {3})",
  description: "Replace the point list with a straight line.",
  params: [
    { id: "x1", name: "X1", desc: "Start X.", type: "number", initialValue: "0" },
    { id: "y1", name: "Y1", desc: "Start Y.", type: "number", initialValue: "0" },
    { id: "x2", name: "X2", desc: "End X.", type: "number", initialValue: "100" },
    { id: "y2", name: "Y2", desc: "End Y.", type: "number", initialValue: "0" },
  ],
};

export const expose = true;

export default function (x1, y1, x2, y2) {
  this._replacePoints([
    { x: +x1 || 0, y: +y1 || 0, width: this._defaultWidth, r: 1, g: 1, b: 1, a: 1 },
    { x: +x2 || 0, y: +y2 || 0, width: this._defaultWidth, r: 1, g: 1, b: 1, a: 1 },
  ]);
}
