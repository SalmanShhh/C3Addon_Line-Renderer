export const config = {
  listName: "Point exists",
  displayText: "{my} point {0} exists",
  description: "True if a point with the given index exists.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (index) {
  return this._isValidPointIndex(this._coercePointIndex(index));
}