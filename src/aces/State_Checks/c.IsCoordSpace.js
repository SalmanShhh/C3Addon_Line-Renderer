import { COORD_SPACE_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Compare co-ordinate space",
  displayText: "{my} co-ordinate space is {0}",
  description: "True if the line uses the given co-ordinate space.",
  params: [
    { id: "space", name: "Co-ordinate space", desc: "The co-ordinate space to compare to.", type: "combo", initialValue: "absolute", items: [{ absolute: "Absolute" }, { relative: "Relative" }] },
  ],
};

export const expose = true;

export default function (space) {
  return this._coordSpace === (COORD_SPACE_KEYS[space] ?? COORD_SPACE_KEYS[0]);
}
