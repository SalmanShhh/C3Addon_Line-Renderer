export const config = {
  listName: "Is point pinned",
  displayText: "{my} point {0} is pinned",
  description: "True if the point is following a pinned instance.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (index) {
  return this._isPointPinned(this._coercePointIndex(index));
}
