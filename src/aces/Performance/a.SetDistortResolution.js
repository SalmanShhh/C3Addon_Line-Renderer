export const config = {
  listName: "Set distortion resolution",
  displayText: "Set {my} distortion resolution to {0}",
  description: "Set the number of mesh subdivisions per segment used for distortion.",
  params: [{ id: "subdivisions", name: "Subdivisions", desc: "The number of mesh subdivisions per segment (at least 1).", type: "number", initialValue: "1" }],
};

export const expose = true;

export default function (subdivisions) {
  this._distortResolution = Math.max(1, Math.floor(+subdivisions || 1));
  this._markMeshDirty();
}
