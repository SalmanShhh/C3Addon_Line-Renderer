export const config = {
  listName: "On point count changed",
  displayText: "On {my} point count changed",
  description: "Triggered when a point is added or removed.",
  isTrigger: true,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}