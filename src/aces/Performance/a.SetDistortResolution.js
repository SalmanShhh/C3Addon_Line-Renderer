export const config = {
  listName: "Set distort resolution",
  displayText: "Set distort resolution to {0}",
  description: "Set the number of vertex pairs per segment.",
  params: [{ id: "subdivisions", name: "Subdivisions", desc: "Subdivision count.", type: "number", initialValue: "1" }],
};

export const expose = true;

export default function (subdivisions) {
  this._distortResolution = Math.max(1, Math.floor(+subdivisions || 1));
  this._markMeshDirty();
}
