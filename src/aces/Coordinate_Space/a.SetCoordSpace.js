import { COORD_SPACE_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set coordinate space",
  displayText: "Set coordinate space to {0}",
  description: "Choose absolute or relative point coordinates.",
  params: [
    {
      id: "space",
      name: "Space",
      desc: "Coordinate space.",
      type: "combo",
      initialValue: "absolute",
      items: [{ absolute: "Absolute" }, { relative: "Relative" }],
    },
  ],
};

export const expose = true;

export default function (space) {
  this._coordSpace = COORD_SPACE_KEYS[space] ?? COORD_SPACE_KEYS[0];
  this._markMeshDirty();
}
