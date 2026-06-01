export const config = {
  listName: "Set point count",
  displayText: "set point count to {0}",
  description: "Resize the internal control-point list.",
  params: [
    {
      id: "count",
      name: "Count",
      desc: "New point count.",
      type: "number",
      initialValue: "2",
    },
  ],
};

export const expose = true;

export default function (count) {
  this._setPointCountInternal(count);
}
