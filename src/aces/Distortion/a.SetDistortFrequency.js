export const config = {
  listName: "Set distortion frequency",
  displayText: "Set {my} distortion frequency to {0}",
  description: "Set the frequency of the distortion wave along the line.",
  params: [{ id: "frequency", name: "Frequency", desc: "The frequency of the wave along the line.", type: "number", initialValue: "1" }],
};

export const expose = true;

export default function (frequency) {
  this._distortFrequency = Math.max(0, +frequency || 0);
  this._markMeshDirty();
}
