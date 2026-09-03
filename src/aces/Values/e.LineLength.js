export const config = {
  returnType: "number",
  description: "The length of the line, in pixels.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshLineLength;
}