export const config = {
  returnType: "number",
  description: "Accumulated UV scroll offset.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshUVScrollOffset;
}