export const config = {
  listName: "Is point index valid",
  displayText: "Point index {0} is valid",
  description: "True if the index points to an existing control point.",
  params: [{ id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (index) {
  return this._isValidPointIndex(this._coercePointIndex(index));
}