export const config = {
  listName: "Is culled",
  displayText: "Is culled",
  description: "True if culling skipped the line on the last tick.",
  params: [],
};

export const expose = true;

export default function () {
  return !!this._isCulled;
}