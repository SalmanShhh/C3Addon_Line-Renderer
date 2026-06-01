export const config = {
  returnType: "number",
  description: "Current distortion frequency.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortFrequency;
}