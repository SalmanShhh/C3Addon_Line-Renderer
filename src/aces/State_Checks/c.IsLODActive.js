export const config = {
  listName: "Is LOD active",
  displayText: "LOD is active",
  description: "True if the render LOD cap is reducing the rendered point count.",
  params: [],
};

export const expose = true;

export default function () {
  return this._renderLOD > 0 && this._renderLOD < this._points.length;
}
