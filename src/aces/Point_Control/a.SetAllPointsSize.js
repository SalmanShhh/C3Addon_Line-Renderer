export const config = {
  listName: "Set size of all points",
  displayText: "Set {my} size of all points to ({0}, {1})",
  description: "Set the width (texture width per segment: 0 = automatic, a value fixes it) and height (line thickness) of every point. Use -1 to keep a value.",
  params: [
    { id: "width", name: "Width", desc: "Texture width per segment, in pixels: 0 = automatic, a value fixes it, -1 = keep.", type: "number", initialValue: "-1" },
    { id: "height", name: "Height", desc: "The line thickness, in pixels, or -1 to keep.", type: "number", initialValue: "32" },
  ],
};

export const expose = true;

export default function (width, height) {
  for (let index = 0; index < this._points.length; index++) {
    this._setPointSize(index, width, height);
  }
}
