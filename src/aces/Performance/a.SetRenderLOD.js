export const config = {
  listName: "Set maximum drawn points",
  displayText: "Set {my} maximum drawn points to {0}",
  description: "Limit how many points are used to draw the line. 0 uses all points.",
  params: [{ id: "maxPoints", name: "Maximum points", desc: "The maximum number of points used to draw the line, or 0 for all.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (maxPoints) {
  this._renderLOD = Math.max(0, Math.floor(+maxPoints || 0));
  this._markMeshDirty();
}
