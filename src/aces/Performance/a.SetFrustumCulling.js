export const config = {
  listName: "Set frustum culling",
  displayText: "Set frustum culling to {0}",
  description: "Enable or disable off-screen culling.",
  params: [{ id: "enabled", name: "Enabled", desc: "Whether culling is enabled.", type: "boolean", initialValue: "false" }],
};

export const expose = true;

export default function (enabled) {
  this._frustumCullingEnabled = !!enabled;
}
