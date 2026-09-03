export const config = {
  listName: "Is culled off-screen",
  displayText: "{my} is culled off-screen",
  description: "True if the last update was skipped because the line was off-screen.",
  params: [],
};

export const expose = true;

export default function () {
  return !!this._isCulled;
}