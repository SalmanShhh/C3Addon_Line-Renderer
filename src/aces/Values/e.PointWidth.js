export const config = {
  returnType: "number",
  description: "The texture width of the segment starting at a point, in pixels: its fixed width if set, otherwise its current length.",
  params: [{ id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number" }],
};

export const expose = true;

export default function (index) {
  return this.MeshGetPointTextureWidth(index);
}
