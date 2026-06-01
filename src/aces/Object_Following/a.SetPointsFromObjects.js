export const config = {
  listName: "Set points from objects",
  displayText: "Set points from objects {0}",
  description: "Rebuild the point list from picked instances.",
  params: [{ id: "object", name: "Object", desc: "Objects to read.", type: "object" }],
};

export const expose = true;

export default function (object) {
  const instances = this._getPickedInstances(object);
  if (instances.length < 2) {
    return;
  }

  this._replacePoints(
    instances.map((instance) => ({
      x: +instance.x || 0,
      y: +instance.y || 0,
      width: this._defaultWidth,
      r: 1,
      g: 1,
      b: 1,
      a: 1,
    }))
  );
}
