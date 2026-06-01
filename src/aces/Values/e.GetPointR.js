export const config = {
  returnType: "number",
  description: "Red channel of a control point.",
  params: [{ id: "index", name: "Index", desc: "Control point index.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointR(index);
}