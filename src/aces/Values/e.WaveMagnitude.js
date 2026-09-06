export const config = {
  returnType: "number",
  description: "How far the wave pushes points, in pixels.",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshWaveMagnitude;
}
