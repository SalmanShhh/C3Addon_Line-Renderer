export const config = {
  listName: "Set facing",
  displayText: "Set {my} facing to {0}",
  description: "Set how the width of the line is oriented in 3D.",
  params: [
    {
      id: "facing",
      name: "Facing",
      desc: "Flat stays in the layout plane, Billboard faces the camera, Up vector follows the up vector.",
      type: "combo",
      initialValue: "flat",
      items: [
        { flat: "Flat" },
        { billboard: "Billboard" },
        { up_vector: "Up vector" },
      ],
    },
  ],
};

export const expose = true;

export default function (facing) {
  // facing is the combo index; _setRibbonFacing -> getComboKey maps it to a key.
  this._setRibbonFacing(facing);
}
