import { END_CAP_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set end caps",
  displayText: "Set {my} end caps to {0}",
  description: "Set the shape of the start and end of the line.",
  params: [
    {
      id: "style",
      name: "End caps",
      desc: "None cuts off at the end point. Square and Round extend by half the thickness.",
      type: "combo",
      initialValue: "round",
      items: [{ round: "Round" }, { flat: "None" }, { square: "Square" }],
    },
  ],
};

export const expose = true;

export default function (style) {
  this._endCapStyle = END_CAP_KEYS[style] ?? END_CAP_KEYS[0];
  this._markMeshDirty();
}
