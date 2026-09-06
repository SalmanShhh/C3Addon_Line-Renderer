export const config = {
  listName: "Set wave magnitude",
  displayText: "Set {my} wave magnitude to {0}",
  description: "Set how far the wave pushes points, in pixels. 0 turns the wave off; animate it to fade a wave in or out.",
  params: [{ id: "magnitude", name: "Magnitude", desc: "How far points are pushed, in pixels.", type: "number", initialValue: "10" }],
};

export const expose = true;

export default function (magnitude) {
  this._setWaveMagnitude(magnitude);
}
