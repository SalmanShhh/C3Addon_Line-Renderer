import { clamp01 } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set opacity",
  displayText: "Set opacity to {0}",
  description: "Set master opacity of the stroke.",
  params: [{ id: "opacity", name: "Opacity", desc: "Opacity percent.", type: "number", initialValue: "100" }],
};

export const expose = true;

export default function (opacity) {
  this.opacity = clamp01((+opacity || 0) / 100);
  this._markMeshDirty();
}
