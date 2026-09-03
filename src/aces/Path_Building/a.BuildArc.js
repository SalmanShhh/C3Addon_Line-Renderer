export const config = {
  listName: "Set arc",
  displayText: "Set {my} arc at ({0}, {1}) radius {2} from {3} to {4} degrees with {5} segments",
  description: "Replace all points with an arc around a position.",
  params: [
    { id: "cx", name: "Center X", desc: "The X co-ordinate of the center of the arc.", type: "number", initialValue: "0" },
    { id: "cy", name: "Center Y", desc: "The Y co-ordinate of the center of the arc.", type: "number", initialValue: "0" },
    { id: "radius", name: "Radius", desc: "The radius of the arc, in pixels.", type: "number", initialValue: "64" },
    { id: "startAngle", name: "Start angle", desc: "The start angle, in degrees.", type: "number", initialValue: "0" },
    { id: "endAngle", name: "End angle", desc: "The end angle, in degrees.", type: "number", initialValue: "180" },
    { id: "segments", name: "Segments", desc: "The number of straight segments used for the arc.", type: "number", initialValue: "8" },
  ],
};

export const expose = true;

export default function (cx, cy, radius, startAngle, endAngle, segments) {
  this._replacePoints(this._buildArcPoints(cx, cy, radius, startAngle, endAngle, segments));
}
