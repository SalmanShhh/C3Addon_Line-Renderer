export const config = {
  returnType: "number",
  description: "Current render LOD cap.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshRenderLOD;
}