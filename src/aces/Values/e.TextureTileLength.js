export const config = {
  returnType: "number",
  description: "Current texture tile length.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshTextureTileLength;
}