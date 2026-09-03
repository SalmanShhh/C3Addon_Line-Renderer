export const config = {
  listName: "Set up vector",
  displayText: "Set {my} up vector to ({0}, {1}, {2})",
  description: "Set the up direction used by Up vector facing. The default (0, 0, 1) points up in Z elevation.",
  params: [
    { id: "x", name: "X", desc: "The X component of the up vector.", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The Y component of the up vector.", type: "number", initialValue: "0" },
    { id: "z", name: "Z", desc: "The Z component of the up vector.", type: "number", initialValue: "1" },
  ],
};

export const expose = true;

export default function (x, y, z) {
  this._setUpVector(x, y, z);
}
