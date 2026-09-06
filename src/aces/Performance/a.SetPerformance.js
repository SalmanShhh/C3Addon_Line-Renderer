export const config = {
  listName: "Set performance",
  displayText: "Set {my} maximum drawn points {0}, wave resolution {1}, off-screen culling {2}",
  description: "Limit how many points are used to draw the line (0 = all), set how many mesh steps each segment is split into for the wave, and whether updates are skipped while the line is off-screen.",
  params: [
    { id: "maxPoints", name: "Maximum drawn points", desc: "The maximum number of points used to draw the line, or 0 for all.", type: "number", initialValue: "0" },
    { id: "waveResolution", name: "Wave resolution", desc: "Mesh steps per segment (at least 1). Use more for a smooth wave on long segments.", type: "number", initialValue: "1" },
    { id: "culling", name: "Off-screen culling", desc: "Skip updating the line while it is off-screen.", type: "combo", initialValue: "disabled", items: [{ disabled: "Disabled" }, { enabled: "Enabled" }] },
  ],
};

export const expose = true;

export default function (maxPoints, waveResolution, culling) {
  this._renderLOD = Math.max(0, Math.floor(+maxPoints || 0));
  this._distortResolution = Math.max(1, Math.floor(+waveResolution || 1));
  this._frustumCullingEnabled = culling === 1 || culling === "enabled" || culling === true;
  this._markMeshDirty();
}
