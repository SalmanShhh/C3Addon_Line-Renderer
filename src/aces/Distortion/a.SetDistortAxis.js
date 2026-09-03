import { DISTORT_AXIS_KEYS } from "../../shared/meshstrokeShared.js";

export const config = {
  listName: "Set distortion axis",
  displayText: "Set {my} distortion axis to {0}",
  description: "Set the direction the distortion wave moves points in.",
  params: [
    {
      id: "axis",
      name: "Axis",
      desc: "The direction of the distortion offset.",
      type: "combo",
      initialValue: "both",
      items: [
        { x_only: "X" },
        { y_only: "Y" },
        { both: "X and Y" },
        { perpendicular: "Perpendicular" },
        { z_only: "Z elevation" },
      ],
    },
  ],
};

export const expose = true;

export default function (axis) {
  this._distortAxis = DISTORT_AXIS_KEYS[axis] ?? DISTORT_AXIS_KEYS[2];
  this._markMeshDirty();
}
