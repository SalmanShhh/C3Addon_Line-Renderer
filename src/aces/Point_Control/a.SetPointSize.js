export const config = {
  listName: "Set point size",
  displayText: "Set {my} point {0} size to ({1}, {2})",
  description: "Set a point's width (texture width of the segment starting at it: 0 = automatic, a value fixes it so the image stretches with the segment) and height (line thickness). Use -1 to keep a value.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "width", name: "Width", desc: "Texture width of the segment, in pixels: 0 = automatic (constant density), a value fixes it, -1 = keep.", type: "number", initialValue: "-1" },
    { id: "height", name: "Height", desc: "The line thickness at this point, in pixels, or -1 to keep.", type: "number", initialValue: "32" },
  ],
};

export const expose = true;

export default function (index, width, height) {
  this._setPointSize(this._coercePointIndex(index), width, height);
}
