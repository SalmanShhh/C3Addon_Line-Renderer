export const config = {
  listName: "Set line between objects",
  displayText: "Set {my} line from {0} to {1}",
  description: "Replace all points with a straight line between the first picked instances of two objects.",
  params: [
    { id: "from", name: "From", desc: "The object to start the line at.", type: "object" },
    { id: "to", name: "To", desc: "The object to end the line at.", type: "object" },
  ],
};

export const expose = true;

export default function (from, to) {
  const fromInstance = this._getFirstPickedInstance(from);
  const toInstance = this._getFirstPickedInstance(to);
  if (!fromInstance || !toInstance) {
    return;
  }

  const start = this._instanceToPointSpace(fromInstance);
  const end = this._instanceToPointSpace(toInstance);
  this._replacePoints([
    this._newPoint(start.x, start.y, this._defaultWidth, start.z),
    this._newPoint(end.x, end.y, this._defaultWidth, end.z),
  ]);
}
