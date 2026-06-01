export const config = {
  returnType: "number",
  description: "World Y of a control point.",
  params: [{ id: "index", name: "Index", desc: "Control point index.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointY(index);
}