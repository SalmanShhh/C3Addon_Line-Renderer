export const config = {
  listName: "Set texture tile length",
  displayText: "Set texture tile length to {0}",
  description: "Set the world-space pixels per texture repeat.",
  params: [{ id: "length", name: "Length", desc: "Tile length.", type: "number", initialValue: "64" }],
};

export const expose = true;

export default function (length) {
  this._textureTileLength = Math.max(0.0001, +length || 0.0001);
  this._markMeshDirty();
}
