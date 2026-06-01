export const config = {
  listName: "Set distort speed",
  displayText: "Set distort speed to {0}",
  description: "Set distortion speed.",
  params: [{ id: "speed", name: "Speed", desc: "Speed.", type: "number", initialValue: "1" }],
};

export const expose = true;

export default function (speed) {
  this._distortSpeed = +speed || 0;
  this._markMeshDirty();
}
