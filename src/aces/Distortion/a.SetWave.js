export const config = {
  listName: "Set wave",
  displayText: "Set {my} wave to magnitude {0}, wavelength {1}, period {2}, {3}, {4}",
  description: "Set the wave that ripples the line: how far points move, the length of one wave, seconds per cycle, the direction points are pushed, and the wave shape.",
  params: [
    { id: "magnitude", name: "Magnitude", desc: "How far points are pushed, in pixels. 0 turns the wave off.", type: "number", initialValue: "10" },
    { id: "wavelength", name: "Wavelength", desc: "The length of one full wave along the line, in pixels.", type: "number", initialValue: "100" },
    { id: "period", name: "Period", desc: "Seconds for one full cycle. The wave travels one wavelength per period; 0 keeps it still, negative reverses it.", type: "number", initialValue: "1" },
    {
      id: "movement", name: "Movement", desc: "The direction points are pushed in.", type: "combo", initialValue: "perpendicular",
      items: [{ x_only: "Horizontal" }, { y_only: "Vertical" }, { both: "Horizontal and vertical" }, { perpendicular: "Across the line" }, { z_only: "Z elevation" }],
    },
    {
      id: "shape", name: "Wave", desc: "The wave shape.", type: "combo", initialValue: "sine",
      items: [{ sine: "Sine" }, { triangle: "Triangle" }, { sawtooth: "Sawtooth" }, { reverse_sawtooth: "Reverse sawtooth" }, { square: "Square" }],
    },
  ],
};

export const expose = true;

export default function (magnitude, wavelength, period, movement, shape) {
  this._setWaveMagnitude(magnitude);
  this._setWavelength(wavelength);
  this._setWavePeriod(period);
  this._setWaveMovement(movement);
  this._setWaveShape(shape);
}
