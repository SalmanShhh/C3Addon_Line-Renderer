export const config = {
  listName: "Set point to image point",
  displayText: "Set {my} point {0} to {1} image point {3} on face {2}",
  description: "Set a point to the position of an image point of the first picked instance, including its Z elevation. Choose a face for 3D shape face image points.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "object", name: "Object", desc: "The object to take the image point from.", type: "object" },
    {
      id: "face",
      name: "Face",
      desc: "The 3D shape face the image point is on, or None for other objects.",
      type: "combo",
      initialValue: "none",
      items: [
        { none: "None (object image point)" },
        { back: "Back" },
        { front: "Front" },
        { left: "Left" },
        { right: "Right" },
        { top: "Top" },
        { bottom: "Bottom" },
      ],
    },
    { id: "name", name: "Image point", desc: "The name or number of the image point (0 is the origin).", type: "any", initialValue: "0" },
  ],
};

export const expose = true;

const FACES = ["none", "back", "front", "left", "right", "top", "bottom"];

export default function (index, object, face, name) {
  const target = this._getFirstPickedInstance(object);
  if (!target) {
    return;
  }
  const faceKey = typeof face === "number" ? FACES[face] ?? "none" : String(face ?? "none");
  const [x, y, z] = this._getAttachPosition(target, { face: faceKey, name });
  this._setPointToLayout(index, x, y, z);
}
