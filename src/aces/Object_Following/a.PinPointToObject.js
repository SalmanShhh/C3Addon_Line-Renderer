export const config = {
  listName: "Pin point to object",
  displayText: "Pin {my} point {0} to {1} image point {2} on face {3} ({4})",
  description: "Move a point to an image point of the first picked instance (with its Z elevation) and, when pinned, keep following it every tick. Setting a point past the end adds points up to it.",
  params: [
    { id: "index", name: "Index", desc: "The zero-based index of the point.", type: "number", initialValue: "0" },
    { id: "object", name: "Object", desc: "The object to pin the point to.", type: "object" },
    { id: "imagePoint", name: "Image point", desc: "The image point name or number to follow (0 is the origin).", type: "any", initialValue: "0" },
    {
      id: "face", name: "Face", desc: "For 3D shapes, the face the image point is on. None for other objects.",
      type: "combo", initialValue: "none",
      items: [{ none: "None" }, { back: "Back" }, { front: "Front" }, { left: "Left" }, { right: "Right" }, { top: "Top" }, { bottom: "Bottom" }],
    },
    {
      id: "mode", name: "Mode", desc: "Pinned keeps following the instance every tick. Once only moves the point now.",
      type: "combo", initialValue: "pinned",
      items: [{ pinned: "Pinned" }, { once: "Once" }],
    },
  ],
};

export const expose = true;

const FACES = ["none", "back", "front", "left", "right", "top", "bottom"];

export default function (index, object, imagePoint, face, mode) {
  const pointIndex = this._coercePointIndex(index);
  const target = this._getFirstPickedInstance(object);
  if (!target) {
    return;
  }
  const faceKey = typeof face === "number" ? FACES[face] ?? "none" : String(face ?? "none");
  const once = mode === 1 || mode === "once";
  if (once) {
    const [x, y, z] = this._getAttachPosition(target, { face: faceKey, name: imagePoint });
    this._setPointToLayout(pointIndex, x, y, z);
    this._unpinPoint(pointIndex);
    return;
  }
  this._pinPoint(pointIndex, target, { face: faceKey, name: imagePoint });
}
