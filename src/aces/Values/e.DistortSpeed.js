export const config = {
  returnType: "number",
  description: "Current distortion speed.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortSpeed;
}