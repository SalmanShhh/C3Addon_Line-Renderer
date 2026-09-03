export const config = {
  returnType: "number",
  description: "The distortion speed.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortSpeed;
}