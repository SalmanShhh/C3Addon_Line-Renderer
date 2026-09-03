export const config = {
  returnType: "number",
  description: "The number of cross-section points (2 for a ribbon).",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshCrossSection;
}
