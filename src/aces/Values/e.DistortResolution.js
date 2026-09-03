export const config = {
  returnType: "number",
  description: "The number of mesh subdivisions per segment.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshDistortResolution;
}