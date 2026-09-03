export const config = {
  listName: "Set line",
  displayText: "Set {my} line from ({0}, {1}) to ({2}, {3})",
  description: "Replace all points with a straight line between two positions.",
  params: [
    { id: "x1", name: "Start X", desc: "The X co-ordinate of the start of the line.", type: "number", initialValue: "0" },
    { id: "y1", name: "Start Y", desc: "The Y co-ordinate of the start of the line.", type: "number", initialValue: "0" },
    { id: "x2", name: "End X", desc: "The X co-ordinate of the end of the line.", type: "number", initialValue: "100" },
    { id: "y2", name: "End Y", desc: "The Y co-ordinate of the end of the line.", type: "number", initialValue: "0" },
  ],
};

export const expose = true;

export default function (x1, y1, x2, y2) {
  this._replacePoints([this._newPoint(x1, y1), this._newPoint(x2, y2)]);
}
