export const config = {
  returnType: "number",
  description: "The length of one full wave along the line, in pixels.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshWavelength;
}
