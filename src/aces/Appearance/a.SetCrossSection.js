export const config = {
  listName: "Set cross-section points",
  displayText: "Set {my} cross-section points to {0}",
  description: "Set the number of points around the line: 2 draws a flat ribbon, 3 or more draws a 3D tube.",
  params: [
    { id: "points", name: "Points", desc: "The number of points around the cross-section (2 for a ribbon, 3 to 32 for a tube).", type: "number", initialValue: "2" },
  ],
};

export const expose = true;

export default function (points) {
  this._setCrossSection(points);
}
