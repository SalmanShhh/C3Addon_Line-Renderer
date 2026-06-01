export const config = {
  listName: "Set all widths",
  displayText: "Set all widths to {0}",
  description: "Set every point width.",
  params: [{ id: "width", name: "Width", desc: "Width value.", type: "number", initialValue: "16" }],
};

export const expose = true;

export default function (width) {
  const nextWidth = Math.max(0, +width || 0);
  for (const point of this._points) {
    point.width = nextWidth;
  }
  this._markMeshDirty();
}
