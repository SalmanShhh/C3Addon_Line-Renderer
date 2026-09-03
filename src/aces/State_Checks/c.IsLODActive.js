export const config = {
  listName: "Is limiting drawn points",
  displayText: "{my} is limiting drawn points",
  description: "True if the maximum drawn points setting is reducing the number of points drawn.",
  params: [],
};

export const expose = true;

export default function () {
  return this._renderLOD > 0 && this._renderLOD < this._points.length;
}
