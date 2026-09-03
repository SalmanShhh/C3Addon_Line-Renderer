export const config = {
  returnType: "number",
  description: "The width (half thickness) of the line at a point.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointWidth(index);
}