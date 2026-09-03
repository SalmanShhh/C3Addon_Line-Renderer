export const config = {
  returnType: "number",
  description: "The number of points used to draw the line after the maximum drawn points limit.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshRenderedPointCount;
}