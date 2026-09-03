export const config = {
  listName: "Set distortion speed",
  displayText: "Set {my} distortion speed to {0}",
  description: "Set how fast the distortion wave moves along the line.",
  params: [{ id: "speed", name: "Speed", desc: "How fast the wave moves along the line.", type: "number", initialValue: "1" }],
};

export const expose = true;

export default function (speed) {
  this._distortSpeed = +speed || 0;
  this._markMeshDirty();
}
