export const config = {
  listName: "Set distort frequency",
  displayText: "Set distort frequency to {0}",
  description: "Set distortion frequency.",
  params: [{ id: "frequency", name: "Frequency", desc: "Frequency.", type: "number", initialValue: "1" }],
};

export const expose = true;

export default function (frequency) {
  this._distortFrequency = Math.max(0, +frequency || 0);
  this._markMeshDirty();
}
