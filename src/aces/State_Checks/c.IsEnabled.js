export const config = {
  listName: "Is enabled",
  displayText: "{my} is enabled",
  description: "True if the line is currently enabled.",
  params: [],
};

export const expose = true;

export default function () {
  return !!this._enabled;
}
