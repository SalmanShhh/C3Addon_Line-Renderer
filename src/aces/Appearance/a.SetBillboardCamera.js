export const config = {
  listName: "Set billboard camera",
  displayText: "Set {my} billboard camera to {0} at ({1}, {2}, {3})",
  description: "Set the camera position used by Billboard facing, either from the 3D camera automatically or from a position.",
  params: [
    {
      id: "mode",
      name: "Mode",
      desc: "Automatic uses the 3D Camera object. Manual uses the position below.",
      type: "combo",
      initialValue: "automatic",
      items: [{ automatic: "Automatic (3D Camera object)" }, { manual: "Manual" }],
    },
    { id: "x", name: "X", desc: "The camera X co-ordinate (manual mode).", type: "number", initialValue: "0" },
    { id: "y", name: "Y", desc: "The camera Y co-ordinate (manual mode).", type: "number", initialValue: "0" },
    { id: "z", name: "Z elevation", desc: "The camera Z elevation (manual mode).", type: "number", initialValue: "1000" },
  ],
};

export const expose = true;

export default function (mode, x, y, z) {
  // Combo parameters arrive as their item index: 0 = automatic, 1 = manual.
  this._setBillboardCamera(mode, x, y, z);
}
