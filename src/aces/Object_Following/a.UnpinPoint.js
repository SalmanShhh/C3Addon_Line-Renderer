export const config = {
  listName: "Unpin point",
  displayText: "Unpin {my} point {0}",
  description: "Stop a point following its pinned instance (the point keeps its position). Use -1 to unpin all points.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point, or -1 for all points.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (index) {
  const pointIndex = this._coercePointIndex(index);
  if (pointIndex < 0) {
    this._unpinAllPoints();
  } else {
    this._unpinPoint(pointIndex);
  }
}
