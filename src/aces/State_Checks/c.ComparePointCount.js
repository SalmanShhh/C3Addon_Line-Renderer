export const config = {
  listName: "Compare point count",
  displayText: "{my} point count {0} {1}",
  description: "Compare the number of points in the line.",
  params: [
    { id: "cmp", name: "Comparison", desc: "How to compare the point count.", type: "cmp" },
    { id: "count", name: "Count", desc: "The number of points to compare to.", type: "number", initialValue: "2" },
  ],
};

export const expose = true;

// Construct comparison parameter values: 0 equal, 1 not equal, 2 less,
// 3 less or equal, 4 greater, 5 greater or equal.
export function compareValues(cmp, a, b) {
  switch (cmp) {
    case 0: return a === b;
    case 1: return a !== b;
    case 2: return a < b;
    case 3: return a <= b;
    case 4: return a > b;
    case 5: return a >= b;
    default: return false;
  }
}

export default function (cmp, count) {
  return compareValues(cmp, this._points.length, Math.floor(+count || 0));
}
