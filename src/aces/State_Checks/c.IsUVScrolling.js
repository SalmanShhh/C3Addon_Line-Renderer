export const config = {
  listName: "Is texture scrolling",
  displayText: "{my} texture is scrolling",
  description: "True if the texture scroll speed is not 0.",
  params: [],
};

export const expose = true;

export default function () {
  return this._uvScrollSpeed !== 0;
}
