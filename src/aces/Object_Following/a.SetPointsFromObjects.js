export const config = {
  listName: "Set points from objects",
  displayText: "Set {my} points from {0} instances",
  description: "Replace all points with the positions of the picked instances of an object, one point per instance.",
  params: [{ id: "object", name: "Object", desc: "The object whose picked instances become the points.", type: "object" }],
};

export const expose = true;

export default function (object) {
  const instances = this._getPickedInstances(object);
  if (instances.length < 2) {
    return;
  }

  this._replacePoints(
    instances.map((instance) => {
      const position = this._instanceToPointSpace(instance);
      return this._newPoint(position.x, position.y, this._defaultWidth, position.z);
    })
  );
}
