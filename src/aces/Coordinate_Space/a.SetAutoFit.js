export const config = {
  listName: "Set auto-fit to line",
  displayText: "Set {my} auto-fit to line {0}",
  description: "Enable or disable moving and resizing the object to cover the line after each update (absolute co-ordinate space only).",
  params: [
    { id: "enabled", name: "Enabled", desc: "Whether auto-fit is enabled.", type: "boolean", initialValue: "true" },
  ],
};

export const expose = true;

export default function (enabled) {
  this._autoFit = !!enabled;
  this._markMeshDirty();
}
