export const config = {
  returnType: "number",
  description: "Current distortion subdivision count.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortResolution;
}