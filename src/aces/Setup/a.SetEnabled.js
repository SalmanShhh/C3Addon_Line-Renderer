export const config = {
  listName: "Set enabled",
  displayText: "Set {my} {0}",
  description: "Enable or disable the line. While disabled the object is drawn normally.",
  params: [
    { id: "state", name: "State", desc: "Whether the line is enabled.", type: "combo", initialValue: "enabled", items: [{ disabled: "Disabled" }, { enabled: "Enabled" }] },
  ],
};

export const expose = true;

export default function (state) {
  this._setEnabled(state === 1 || state === "enabled");
}
