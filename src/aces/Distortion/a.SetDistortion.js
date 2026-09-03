export const config = {
  listName: "Set distortion",
  displayText: "Set {my} distortion to amplitude {0}, frequency {1}, speed {2}",
  description: "Set the amplitude, frequency and speed of the distortion wave.",
  params: [
    { id: "amplitude", name: "Amplitude", desc: "The maximum offset of the wave, in pixels. 0 disables distortion.", type: "number", initialValue: "0" },
    { id: "frequency", name: "Frequency", desc: "The frequency of the wave along the line.", type: "number", initialValue: "1" },
    { id: "speed", name: "Speed", desc: "How fast the wave moves along the line.", type: "number", initialValue: "1" },
  ],
};

export const expose = true;

export default function (amplitude, frequency, speed) {
  this._distortAmplitude = Math.max(0, +amplitude || 0);
  this._distortFrequency = Math.max(0, +frequency || 0);
  this._distortSpeed = +speed || 0;
  this._markMeshDirty();
}
