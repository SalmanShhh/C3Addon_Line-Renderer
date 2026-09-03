export const config = {
  returnType: "number",
  description: "The number of points in the line.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshPointCount;
}