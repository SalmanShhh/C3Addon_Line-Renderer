export const config = {
  listName: "Set joins",
  displayText: "Set {my} joins to {0}",
  description: "Set how corners between segments are drawn.",
  params: [
    {
      id: "style",
      name: "Joins",
      desc: "Simple, Miter, Bevel or Round corners.",
      type: "combo",
      initialValue: "round",
      items: [
        { simple: "Simple" },
        { miter: "Miter" },
        { bevel: "Bevel" },
        { round: "Round" },
      ],
    },
  ],
};

export const expose = true;

export default function (style) {
  // Combo parameters arrive as their item index; _setJoinStyle maps it to a key.
  this._setJoinStyle(style);
}
