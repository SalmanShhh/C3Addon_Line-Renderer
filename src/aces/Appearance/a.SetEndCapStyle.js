import { END_CAP_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set end cap style",
  displayText: "Set end cap style to {0}",
  description: "Set the start and end cap style.",
  params: [
    {
      id: "style",
      name: "Style",
      desc: "Cap style.",
      type: "combo",
      initialValue: "round",
      items: [{ round: "Round" }, { flat: "Flat" }, { square: "Square" }],
    },
  ],
};

export const expose = true;

export default function (style) {
  this._endCapStyle = END_CAP_KEYS[style] ?? END_CAP_KEYS[0];
  this._markMeshDirty();
}
