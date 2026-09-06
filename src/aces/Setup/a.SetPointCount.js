export const config = {
  listName: "Set point count",
  displayText: "Set {my} point count to {0}",
  description: "Set the number of points in the line, adding points at the end or removing points from the end.",
  params: [{ id: "count", name: "Count", desc: "The new number of points (at least 2).", type: "number", initialValue: "2" }],
};

export const expose = true;

export default function (count) {
  this._setPointCountInternal(count);
}
