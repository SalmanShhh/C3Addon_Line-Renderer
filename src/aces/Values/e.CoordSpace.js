export const config = {
  returnType: "string",
  description: "The co-ordinate space: \"absolute\" or \"relative\".",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshCoordSpace;
}