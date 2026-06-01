export const config = {
  returnType: "number",
  description: "Total number of control points.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshPointCount;
}