export const config = {
  listName: "Pin points to objects",
  displayText: "Pin {my} points to {0} instances ({1})",
  description: "Replace all points with one per picked instance of an object (in picking order) and, when pinned, keep each point following its instance every tick.",
  params: [
    { id: "object", name: "Object", desc: "The object whose picked instances become the points. At least two instances are needed.", type: "object" },
    {
      id: "mode", name: "Mode", desc: "Pinned keeps following the instances every tick. Once only sets the points now.",
      type: "combo", initialValue: "pinned",
      items: [{ pinned: "Pinned" }, { once: "Once" }],
    },
  ],
};

export const expose = true;

export default function (object, mode) {
  const instances = this._getPickedInstances(object);
  if (instances.length < 2) {
    return;
  }
  const points = instances.map((instance) => {
    const position = this._instanceToPointSpace(instance);
    return this._newPoint(position.x, position.y, this._defaultWidth, position.z);
  });
  const once = mode === 1 || mode === "once";
  const uids = once ? null : instances.map((instance) => this._getInstanceUid(instance));
  this._replacePoints(points, true, uids);
}
