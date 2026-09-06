export const config = {
  returnType: "number",
  description: "The layout Z elevation of a point.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointZ(index);
}
