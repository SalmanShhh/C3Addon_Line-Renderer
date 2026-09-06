export const config = {
  returnType: "number",
  description: "The texture length of the line, in pixels (the object width after Auto-fit). Equals LineLength unless some segments have a fixed width.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshTextureLength;
}
