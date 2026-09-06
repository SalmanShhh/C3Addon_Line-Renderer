export const config = {
  listName: "Is wave active",
  displayText: "{my} wave is active",
  description: "True if the wave magnitude is greater than 0.",
  params: [],
};

export const expose = true;

export default function () {
  return this._waveMagnitude > 0;
}
