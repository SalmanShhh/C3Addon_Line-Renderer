export const config = {
  listName: "On point count changed",
  displayText: "On point count changed",
  description: "Triggered when the point count changes.",
  isTrigger: true,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}