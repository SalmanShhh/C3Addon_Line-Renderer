export const config = {
  returnType: "number",
  description: "The line thickness at a point, in pixels.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointHeight(index);
}
