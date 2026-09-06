import { END_CAP_KEYS, JOIN_STYLE_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set line style",
  displayText: "Set {my} line style to end caps {0}, joins {1}, cross-section points {2}",
  description: "Set the shape of the line ends, how corners are drawn, and the number of points around the line (2 = flat ribbon, 3 or more = 3D tube).",
  params: [
    { id: "caps", name: "End caps", desc: "None cuts off at the end point; Square and Round extend by half the thickness.", type: "combo", initialValue: "round", items: [{ round: "Round" }, { flat: "None" }, { square: "Square" }] },
    { id: "joins", name: "Joins", desc: "Simple, Miter, Bevel or Round corners.", type: "combo", initialValue: "round", items: [{ simple: "Simple" }, { miter: "Miter" }, { bevel: "Bevel" }, { round: "Round" }] },
    { id: "crossSection", name: "Cross-section points", desc: "Points around the line: 2 for a flat ribbon, 3 to 32 for a tube.", type: "number", initialValue: "2" },
  ],
};

export const expose = true;

export default function (caps, joins, crossSection) {
  this._endCapStyle = END_CAP_KEYS[caps] ?? END_CAP_KEYS[0];
  this._setJoinStyle(joins);
  this._setCrossSection(crossSection);
  this._markMeshDirty();
}
