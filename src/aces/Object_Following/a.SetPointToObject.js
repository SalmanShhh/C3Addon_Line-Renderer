export const config = {
  listName: "Set point to object",
  displayText: "Set {my} point {0} to position of {1}",
  description: "Set a point to the position and Z elevation of the first picked instance of an object.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "object", name: "Object", desc: "The object to take the position from.", type: "object" },
  ],
};

export const expose = true;

export default function (index, object) {
  const pointIndex = this._coercePointIndex(index);
  const objectInstance = this._getFirstPickedInstance(object);
  if (!this._isValidPointIndex(pointIndex) || !objectInstance) {
    return;
  }

  const position = this._instanceToPointSpace(objectInstance);
  const point = this._points[pointIndex];
  point.x = position.x;
  point.y = position.y;
  point.z = position.z;
  this._markMeshDirty();
}
