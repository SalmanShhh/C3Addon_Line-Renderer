export const config = {
  listName: "Set render LOD",
  displayText: "Set render LOD to {0}",
  description: "Cap the point count used for the rendered mesh.",
  params: [{ id: "maxPoints", name: "Max points", desc: "LOD cap.", type: "number", initialValue: "0" }],
};

export const expose = true;

export default function (maxPoints) {
  this._renderLOD = Math.max(0, Math.floor(+maxPoints || 0));
  this._markMeshDirty();
}
