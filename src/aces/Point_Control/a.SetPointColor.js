import { colorFromC3 } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set point color",
  displayText: "Set point {0} color to ({1}, {2}, {3}) opacity {4}",
  description: "Set the tint of a point.",
  params: [
    { id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" },
    { id: "r", name: "Red", desc: "Red channel.", type: "number", initialValue: "255" },
    { id: "g", name: "Green", desc: "Green channel.", type: "number", initialValue: "255" },
    { id: "b", name: "Blue", desc: "Blue channel.", type: "number", initialValue: "255" },
    { id: "opacity", name: "Opacity", desc: "Opacity percent.", type: "number", initialValue: "100" },
  ],
};

export const expose = true;

export default function (index, r, g, b, opacity) {
  this._setPointColorInternal(this._coercePointIndex(index), colorFromC3(r, g, b, opacity));
}
