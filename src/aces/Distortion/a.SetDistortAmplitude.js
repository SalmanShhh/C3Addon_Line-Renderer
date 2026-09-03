export const config = {
  listName: "Set distortion amplitude",
  displayText: "Set {my} distortion amplitude to {0}",
  description: "Set the maximum offset of the distortion wave. 0 disables distortion.",
  params: [{ id: "amplitude", name: "Amplitude", desc: "The maximum offset of the wave, in pixels.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (amplitude) {
  this._distortAmplitude = Math.max(0, +amplitude || 0);
  this._markMeshDirty();
}
