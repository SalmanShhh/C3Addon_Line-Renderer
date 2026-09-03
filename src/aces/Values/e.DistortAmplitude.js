export const config = {
  returnType: "number",
  description: "The distortion amplitude, in pixels.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortAmplitude;
}