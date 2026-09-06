export const config = {
  listName: "Set auto-fit to line",
  displayText: "Set {my} auto-fit to line {0}",
  description: "Enable or disable sizing the object to the unrolled line (texture length by thickness) after each update (absolute co-ordinate space only).",
  params: [{ id: "state", name: "State", desc: "Whether auto-fit is enabled.", type: "combo", initialValue: "enabled", items: [{ disabled: "Disabled" }, { enabled: "Enabled" }] }],
};

export const expose = true;

export default function (state) {
  this._autoFit = state === 1 || state === "enabled" || state === true;
  this._markMeshDirty();
}
