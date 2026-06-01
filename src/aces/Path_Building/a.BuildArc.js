export const config = {
  listName: "Build arc",
  displayText: "Build arc at ({0}, {1}) radius {2} from {3} to {4} with {5} segments",
  description: "Build an arc into control points.",
  params: [
    { id: "cx", name: "Center X", desc: "Center X.", type: "number", initialValue: "0" },
    { id: "cy", name: "Center Y", desc: "Center Y.", type: "number", initialValue: "0" },
    { id: "radius", name: "Radius", desc: "Arc radius.", type: "number", initialValue: "64" },
    { id: "startAngle", name: "Start angle", desc: "Start angle in degrees.", type: "number", initialValue: "0" },
    { id: "endAngle", name: "End angle", desc: "End angle in degrees.", type: "number", initialValue: "180" },
    { id: "segments", name: "Segments", desc: "Segment count.", type: "number", initialValue: "8" },
  ],
};

export const expose = true;

export default function (cx, cy, radius, startAngle, endAngle, segments) {
  this._replacePoints(this._buildArcPoints(cx, cy, radius, startAngle, endAngle, segments));
}
