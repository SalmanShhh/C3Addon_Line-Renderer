export const config = {
  listName: "Set off-screen culling",
  displayText: "Set {my} off-screen culling {0}",
  description: "Enable or disable skipping line updates while the line is off-screen.",
  params: [{ id: "enabled", name: "Enabled", desc: "Whether off-screen culling is enabled.", type: "boolean", initialValue: "false" }],
};

export const expose = true;

export default function (enabled) {
  this._frustumCullingEnabled = !!enabled;
}
