// Editor-side behavior instance. Behaviors have no Layout View visual, so the
// host Sprite / Tiled Background draws itself as normal in the editor; the line
// only appears at runtime, when the behavior writes the host object's mesh.
export default function (parentClass) {
  return class extends parentClass {
    constructor(sdkBehType, behInst) {
      super(sdkBehType, behInst);
    }

    Release() {}

    OnAddedInEditor() {}

    OnPropertyChanged(_id, _value) {}
  };
}
