export default function (parentClass) {
  return class extends parentClass {
    constructor(sdkBehavior, iBehaviorType) {
      super(sdkBehavior, iBehaviorType);
    }
  };
}
