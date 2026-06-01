export const config = {
  listName: "Connect objects",
  displayText: "Connect {0} to {1}",
  description: "Build a two-point line between picked objects.",
  params: [
    { id: "from", name: "From", desc: "Start object.", type: "object" },
    { id: "to", name: "To", desc: "End object.", type: "object" },
  ],
};

export const expose = true;

export default function (from, to) {
  const fromInstance = this._getFirstPickedInstance(from);
  const toInstance = this._getFirstPickedInstance(to);
  if (!fromInstance || !toInstance) {
    return;
  }

  this._replacePoints([
    { x: +fromInstance.x || 0, y: +fromInstance.y || 0, width: this._defaultWidth, r: 1, g: 1, b: 1, a: 1 },
    { x: +toInstance.x || 0, y: +toInstance.y || 0, width: this._defaultWidth, r: 1, g: 1, b: 1, a: 1 },
  ]);
}
