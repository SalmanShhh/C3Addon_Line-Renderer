export const config = {
  returnType: "number",
  description: "The distortion frequency.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortFrequency;
}