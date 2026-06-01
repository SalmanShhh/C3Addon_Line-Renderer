export const config = {
  returnType: "number",
  description: "Length of the last built polyline.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshLineLength;
}