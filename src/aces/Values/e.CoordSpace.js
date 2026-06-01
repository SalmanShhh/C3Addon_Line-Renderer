export const config = {
  returnType: "string",
  description: "Current coordinate space.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshCoordSpace;
}