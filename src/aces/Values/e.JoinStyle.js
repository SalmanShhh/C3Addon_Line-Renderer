export const config = {
  returnType: "string",
  description: "The join style: \"simple\", \"miter\", \"bevel\" or \"round\".",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshJoinStyle;
}
