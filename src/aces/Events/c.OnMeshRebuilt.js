export const config = {
  listName: "On mesh rebuilt",
  displayText: "On mesh rebuilt",
  description: "Triggered when the mesh is rebuilt this tick.",
  isTrigger: true,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}