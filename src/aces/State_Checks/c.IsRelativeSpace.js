export const config = {
  listName: "Is relative space",
  displayText: "Coordinate space is relative",
  description: "True if points are interpreted relative to the instance transform.",
  params: [],
};

export const expose = true;

export default function () {
  return this._coordSpace === "relative";
}
