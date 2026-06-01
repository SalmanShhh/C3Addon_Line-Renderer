export const config = {
  listName: "Set distortion",
  displayText: "Set distortion amplitude {0} frequency {1} speed {2}",
  description: "Set all distortion parameters.",
  params: [
    { id: "amplitude", name: "Amplitude", desc: "Distortion amplitude.", type: "number", initialValue: "0" },
    { id: "frequency", name: "Frequency", desc: "Distortion frequency.", type: "number", initialValue: "1" },
    { id: "speed", name: "Speed", desc: "Distortion speed.", type: "number", initialValue: "1" },
  ],
};

export const expose = true;

export default function (amplitude, frequency, speed) {
  this._distortAmplitude = Math.max(0, +amplitude || 0);
  this._distortFrequency = Math.max(0, +frequency || 0);
  this._distortSpeed = +speed || 0;
  this._markMeshDirty();
}
