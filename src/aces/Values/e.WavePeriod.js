export const config = {
  returnType: "number",
  description: "Seconds per wave cycle (0 = still).",
  params: [],
};

export const expose = true;

export default function () {
  return this.MeshWavePeriod;
}
