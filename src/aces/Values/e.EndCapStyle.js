export const config = {
  returnType: "string",
  description: "The end cap style: \"round\", \"flat\" or \"square\".",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshEndCapStyle;
}
