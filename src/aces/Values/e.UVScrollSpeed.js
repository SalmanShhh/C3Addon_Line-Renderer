export const config = {
  returnType: "number",
  description: "Current UV scroll speed.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshUVScrollSpeed;
}