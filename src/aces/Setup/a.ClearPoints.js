export const config = {
  listName: "Clear points",
  displayText: "Clear {my} points",
  description: "Remove all points, leaving two points at the origin.",
  params: [],
};

export const expose = true;

export default function () {
  this._replacePoints([this._newPoint(0, 0), this._newPoint(0, 0)], true);
}
