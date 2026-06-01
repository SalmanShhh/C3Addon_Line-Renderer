export const config = {
  listName: "Smooth path",
  displayText: "Smooth path with {0} subdivisions",
  description: "Replace the path with a Catmull-Rom spline.",
  params: [{ id: "subdivisions", name: "Subdivisions", desc: "Inserted points per segment.", type: "number", initialValue: "3" }],
};

export const expose = true;

export default function (subdivisions) {
  this._replacePoints(this._catmullRom(this._points, subdivisions));
}
