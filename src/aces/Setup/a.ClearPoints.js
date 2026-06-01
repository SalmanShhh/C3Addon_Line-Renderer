export const config = {
  listName: "Clear points",
  displayText: "Clear points",
  description: "Reset to two default control points.",
  params: [],
};

export const expose = true;

export default function () {
  this._replacePoints([
    { x: 0, y: 0, width: this._defaultWidth, r: 1, g: 1, b: 1, a: 1 },
    { x: 0, y: 0, width: this._defaultWidth, r: 1, g: 1, b: 1, a: 1 },
  ], true);
}
