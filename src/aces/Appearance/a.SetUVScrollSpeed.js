export const config = {
  listName: "Set texture scroll speed",
  displayText: "Set {my} texture scroll speed to {0}",
  description: "Set how fast the image scrolls along the line (Tiled Background only).",
  params: [{ id: "speed", name: "Speed", desc: "The scroll speed along the line, in pixels per second.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (speed) {
  this._uvScrollSpeed = +speed || 0;
  this._markMeshDirty();
}
