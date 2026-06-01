export const config = {
  listName: "Set UV scroll speed",
  displayText: "Set UV scroll speed to {0}",
  description: "Set texture scroll speed.",
  params: [{ id: "speed", name: "Speed", desc: "Scroll speed.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (speed) {
  this._uvScrollSpeed = +speed || 0;
  this._markMeshDirty();
}
