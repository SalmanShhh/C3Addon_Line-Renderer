export const config = {
  returnType: "number",
  description: "The layout X co-ordinate of a point.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointX(index);
}