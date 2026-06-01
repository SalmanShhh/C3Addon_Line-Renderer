export const config = {
  listName: "Is distortion active",
  displayText: "Distortion is active",
  description: "True if distortion amplitude is greater than zero.",
  params: [],
};

export const expose = true;

export default function () {
  return this._distortAmplitude > 0;
}
