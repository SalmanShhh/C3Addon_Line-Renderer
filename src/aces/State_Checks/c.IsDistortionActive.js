export const config = {
  listName: "Is distorting",
  displayText: "{my} is distorting",
  description: "True if the distortion amplitude is greater than 0.",
  params: [],
};

export const expose = true;

export default function () {
  return this._distortAmplitude > 0;
}
