import { colorFromC3 } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set all colors",
  displayText: "Set all colors to ({0}, {1}, {2}) opacity {3}",
  description: "Set every point tint.",
  params: [
    { id: "r", name: "Red", desc: "Red channel.", type: "number", initialValue: "255" },
    { id: "g", name: "Green", desc: "Green channel.", type: "number", initialValue: "255" },
    { id: "b", name: "Blue", desc: "Blue channel.", type: "number", initialValue: "255" },
    { id: "opacity", name: "Opacity", desc: "Opacity percent.", type: "number", initialValue: "100" },
  ],
};

export const expose = true;

export default function (r, g, b, opacity) {
  const color = colorFromC3(r, g, b, opacity);
  for (let index = 0; index < this._points.length; index++) {
    this._setPointColorInternal(index, color);
  }
}
