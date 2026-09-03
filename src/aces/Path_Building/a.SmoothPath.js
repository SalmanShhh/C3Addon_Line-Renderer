export const config = {
  listName: "Smooth line",
  displayText: "Smooth {my} line with {0} subdivisions",
  description: "Replace the points with a smooth curve passing through them.",
  params: [{ id: "subdivisions", name: "Subdivisions", desc: "The number of points added between each pair of existing points.", type: "number", initialValue: "3" }],
};

export const expose = true;

export default function (subdivisions) {
  this._replacePoints(this._catmullRom(this._points, subdivisions));
}
