export const config = {
  listName: "Set width of all points",
  displayText: "Set {my} width of all points to {0}",
  description: "Set the width of the line at every point.",
  params: [{ id: "width", name: "Width", desc: "Half the thickness of the line, in pixels.", type: "number", initialValue: "16" }],
};

export const expose = true;

export default function (width) {
  const nextWidth = Math.max(0, +width || 0);
  for (const point of this._points) {
    point.width = nextWidth;
  }
  this._markMeshDirty();
}
