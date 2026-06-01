export const config = {
  listName: "Set distort amplitude",
  displayText: "Set distort amplitude to {0}",
  description: "Set distortion amplitude.",
  params: [{ id: "amplitude", name: "Amplitude", desc: "Amplitude.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (amplitude) {
  this._distortAmplitude = Math.max(0, +amplitude || 0);
  this._markMeshDirty();
}
