export const config = {
  listName: "Is texture assigned",
  displayText: "Texture is assigned",
  description: "True if a stroke texture is available.",
  params: [],
};

export const expose = true;

export default function () {
  return !!this._hasTexture?.();
}
