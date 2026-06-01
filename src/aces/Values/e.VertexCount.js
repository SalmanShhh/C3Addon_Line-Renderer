export const config = {
  returnType: "number",
  description: "Vertex count of the last built mesh.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshVertexCount;
}