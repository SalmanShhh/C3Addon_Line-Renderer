import { DISTORT_AXIS_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set distort axis",
  displayText: "Set distort axis to {0}",
  description: "Set which axis distortion offsets apply to.",
  params: [
    {
      id: "axis",
      name: "Axis",
      desc: "Distortion axis.",
      type: "combo",
      initialValue: "both",
      items: [
        { x_only: "X only" },
        { y_only: "Y only" },
        { both: "Both" },
        { perpendicular: "Perpendicular" },
      ],
    },
  ],
};

export const expose = true;

export default function (axis) {
  this._distortAxis = DISTORT_AXIS_KEYS[axis] ?? DISTORT_AXIS_KEYS[2];
  this._markMeshDirty();
}
