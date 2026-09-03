export const config = {
  listName: "Fit object to line",
  displayText: "Fit {my} object to line",
  description: "Move and resize the object once so that it covers the line (absolute co-ordinate space only).",
  params: [],
};

export const expose = true;

export default function () {
  this._fitHostToLineNow();
}
