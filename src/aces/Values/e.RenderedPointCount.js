export const config = {
  returnType: "number",
  description: "Rendered point count used in the last mesh build.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshRenderedPointCount;
}