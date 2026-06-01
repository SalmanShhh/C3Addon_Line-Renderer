import { BLEND_MODE_KEYS, getBlendModeValue } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set blend mode",
  displayText: "Set blend mode to {0}",
  description: "Set the stroke blend mode.",
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "Blend mode.",
      type: "combo",
      initialValue: "normal",
      items: [
        { normal: "Normal" },
        { additive: "Additive" },
        { multiply: "Multiply" },
        { screen: "Screen" },
      ],
    },
  ],
};

export const expose = true;

export default function (mode) {
  this._blendMode = BLEND_MODE_KEYS[mode] ?? BLEND_MODE_KEYS[0];
  this.blendMode = getBlendModeValue(this._blendMode);
}
