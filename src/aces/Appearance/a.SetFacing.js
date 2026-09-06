export const config = {
  listName: "Set facing",
  displayText: "Set {my} facing to {0} with ({1}, {2}, {3})",
  description: "Set how the line width is oriented in 3D. Flat stays in the layout plane. Billboard faces the camera: X, Y, Z give a camera position, or all 0 to use the 3D Camera object. Up vector follows the up direction given by X, Y, Z.",
  params: [
    { id: "facing", name: "Facing", desc: "Flat, Billboard or Up vector.", type: "combo", initialValue: "flat", items: [{ flat: "Flat" }, { billboard: "Billboard" }, { up_vector: "Up vector" }] },
    { id: "x", name: "X", desc: "Camera X (Billboard) or up vector X (Up vector).", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "Camera Y (Billboard) or up vector Y (Up vector).", type: "number", initialValue: "0" },
    { id: "z", name: "Z", desc: "Camera Z elevation (Billboard; all 0 = automatic) or up vector Z (Up vector).", type: "number", initialValue: "0" },
  ],
};

export const expose = true;

export default function (facing, x, y, z) {
  this._setRibbonFacing(facing);
  const fx = +x || 0;
  const fy = +y || 0;
  const fz = +z || 0;
  if (this._ribbonFacing === "billboard") {
    const automatic = fx === 0 && fy === 0 && fz === 0;
    this._setBillboardCamera(automatic ? 0 : 1, fx, fy, fz);
  } else if (this._ribbonFacing === "up_vector") {
    this._setUpVector(fx, fy, fz === 0 && fx === 0 && fy === 0 ? 1 : fz);
  }
}
