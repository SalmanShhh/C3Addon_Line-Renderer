import { COORD_SPACE_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set co-ordinate space",
  displayText: "Set {my} co-ordinate space to {0}",
  description: "Set whether points are in layout co-ordinates (absolute) or relative to the object (relative).",
  params: [
    {
      id: "space",
      name: "Co-ordinate space",
      desc: "Absolute uses layout co-ordinates. Relative uses co-ordinates relative to the object's position, angle and size.",
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
