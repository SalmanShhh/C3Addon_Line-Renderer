export const config = {
  returnType: "number",
  description: "Current distortion amplitude.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortAmplitude;
}