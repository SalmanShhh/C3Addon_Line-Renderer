export const config = {
  listName: "Set point to object",
  displayText: "Set point {0} to object {1}",
  description: "Set a point position from the first picked instance.",
  params: [
    { id: "index", name: "Index", desc: "Point index.", type: "number", initialValue: "0" },
    { id: "object", name: "Object", desc: "Object to read.", type: "object" },
  ],
};

export const expose = true;

export default function (index, object) {
  const pointIndex = this._coercePointIndex(index);
  const objectInstance = this._getFirstPickedInstance(object);
  if (!this._isValidPointIndex(pointIndex) || !objectInstance) {
    return;
  }

  this._points[pointIndex].x = +objectInstance.x || 0;
  this._points[pointIndex].y = +objectInstance.y || 0;
  this._markMeshDirty();
}
