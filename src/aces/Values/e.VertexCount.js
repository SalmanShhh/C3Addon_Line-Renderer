export const config = {
  returnType: "number",
  description: "The number of mesh points used to draw the line.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshVertexCount;
}