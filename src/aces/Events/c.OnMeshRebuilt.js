export const config = {
  listName: "On line updated",
  displayText: "On {my} line updated",
  description: "Triggered after the line's mesh has been updated.",
  isTrigger: true,
  params: [],
};

export const expose = true;

export default function () {
  return true;
}