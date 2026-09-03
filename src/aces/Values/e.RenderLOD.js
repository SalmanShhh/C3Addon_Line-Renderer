export const config = {
  returnType: "number",
  description: "The maximum drawn points setting, or 0 for all points.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshRenderLOD;
}