export const config = {
  listName: "Is UV scrolling",
  displayText: "UV is scrolling",
  description: "True if UV scroll speed is non-zero.",
  params: [],
};

export const expose = true;

export default function () {
  return this._uvScrollSpeed !== 0;
}
