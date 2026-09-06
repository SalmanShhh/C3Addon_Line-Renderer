export const config = {
  listName: "Set point to 3D model node",
  displayText: "Set {my} point {0} to {2} node {3} of {1}",
  description: "Move a point to the position of a mesh or bone node of the first picked 3D model instance, including its Z elevation.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "object", name: "Object", desc: "The 3D model object to take the node from.", type: "object" },
    { id: "nodeType", name: "Node type", desc: "Whether the node name refers to a mesh or a bone.", type: "combo", initialValue: "bone", items: [{ mesh: "Mesh" }, { bone: "Bone" }] },
    { id: "name", name: "Node name", desc: "The name of the node.", type: "string", initialValue: '""' },
  ],
};

export const expose = true;

const NODE_TYPES = ["mesh", "bone"];

export default function (index, object, nodeType, name) {
  const target = this._getFirstPickedInstance(object);
  if (!target) {
    return;
  }
  const typeKey = typeof nodeType === "number" ? NODE_TYPES[nodeType] ?? "bone" : String(nodeType ?? "bone");
  const [x, y, z] = this._getAttachPosition(target, { nodeType: typeKey, name: String(name ?? "") });
  this._setPointToLayout(this._coercePointIndex(index), x, y, z);
}
