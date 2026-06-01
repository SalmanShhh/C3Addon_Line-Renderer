export const config = {
  listName: "Has minimum points",
  displayText: "Has at least {0} points",
  description: "True if the line has enough points.",
  params: [{ id: "minCount", name: "Minimum", desc: "Minimum required points.", type: "number", initialValue: "2" }],
};

export const expose = true;

export default function (minCount) {
  return this._points.length >= Math.max(0, Math.floor(+minCount || 0));
}
