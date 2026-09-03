export const config = {
  returnType: "number",
  description: "The texture scroll speed, in pixels per second.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshUVScrollSpeed;
}