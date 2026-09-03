export const config = {
  returnType: "number",
  description: "How far the texture has scrolled along the line, in pixels.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshUVScrollOffset;
}