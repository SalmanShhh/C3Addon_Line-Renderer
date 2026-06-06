import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
export const addonType = ADDON_TYPE.PLUGIN;
export const type = PLUGIN_TYPE.WORLD;
export const id = "salmanshh_line_renderer2D";
export const name = "Line Renderer 2D";
export const version = _version;
export const minConstructVersion = undefined;
export const author = "SalmanShh";
export const website = "https://www.construct.net";
export const documentation = "https://www.construct.net";
export const description =
  "Procedural mesh-distorted line renderer for ropes, beams, trails, and other dynamic strokes.";
export const category = ADDON_CATEGORY.GENERAL;

export const hasDomside = false;
export const files = {
  extensionScript: {
    enabled: false, // set to false to disable the extension script
    watch: true, // set to true to enable live reload on changes during development
    targets: ["x86", "x64"],
    // you don't need to change this, the build step will rename the dll for you. Only change this if you change the name of the dll exported by Visual Studio
    name: "MyExtension",
  },
  fileDependencies: [],
  remoteFileDependencies: [
    // {
    //   src: "https://example.com/api.js", // Must use https:// or same-protocol // URLs. http:// is not allowed.
    //   type: "" // Optional: "" or "module". Empty string or omit for classic script.
    // }
  ],
  cordovaPluginReferences: [],
  cordovaResourceFiles: [],
};

export const aceCategories = {
  Setup: "Setup",
  Point_Control: "Point Control",
  Path_Building: "Path Building",
  Object_Following: "Object Following",
  Coordinate_Space: "Coordinate Space",
  Distortion: "Distortion",
  Appearance: "Appearance",
  Performance: "Performance",
  Events: "Events",
  State_Checks: "State Checks",
  Values: "Values",
};

export const info = {
  // icon: "icon.svg",
  // PLUGIN world only
  // defaultImageUrl: "default-image.png",
  Set: {
    // COMMON to all
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    // BEHAVIOR only
    IsOnlyOneAllowed: false,

    // PLUGIN world only
    IsResizable: true,
    IsRotatable: true,
    Is3D: false,
    HasImage: true,
    IsTiled: true,
    SupportsZElevation: false,
    SupportsColor: true,
    SupportsEffects: true,
    // The stroke is drawn as a custom triangle mesh (not a plain sprite quad),
    // so effects must be pre-drawn to an offscreen surface before the effect chain runs.
    MustPreDraw: true,

    // PLUGIN object only
    IsSingleGlobal: false,
  },
  // PLUGIN only
  AddCommonACEs: {
    Position: true,
    SceneGraph: true,
    Size: true,
    Angle: true,
    Appearance: false,
    ZOrder: true,
  },
};

export const properties = [
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "initialPointCount",
    options: {
      initialValue: 2,
      interpolatable: false,
      minValue: 2,
    },
    name: "Initial point count",
    desc: "Number of control points allocated when the instance is created.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "textureTileLength",
    options: {
      initialValue: 64,
      interpolatable: false,
      minValue: 0.0001,
    },
    name: "Texture tile length",
    desc: "World-space pixels per full texture repeat along the stroke.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "uvScrollSpeed",
    options: {
      initialValue: 0,
      interpolatable: false,
    },
    name: "UV scroll speed",
    desc: "Pixels per second the texture scrolls from start to end.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "defaultWidth",
    options: {
      initialValue: 16,
      interpolatable: false,
      minValue: 0,
    },
    name: "Default width",
    desc: "Initial width assigned to control points.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "distortAmplitude",
    options: {
      initialValue: 0,
      interpolatable: false,
      minValue: 0,
    },
    name: "Distort amplitude",
    desc: "Maximum pixel offset applied by the distortion pass.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "distortFrequency",
    options: {
      initialValue: 1,
      interpolatable: false,
      minValue: 0,
    },
    name: "Distort frequency",
    desc: "Spatial frequency of the distortion wave.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "distortSpeed",
    options: {
      initialValue: 1,
      interpolatable: false,
    },
    name: "Distort speed",
    desc: "Speed multiplier for distortion phase advance.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "distortAxis",
    options: {
      initialValue: "both",
      interpolatable: false,
      items: [
        { x_only: "X only" },
        { y_only: "Y only" },
        { both: "Both" },
        { perpendicular: "Perpendicular" },
      ],
    },
    name: "Distort axis",
    desc: "Which axis receives the distortion offset.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "endCapStyle",
    options: {
      initialValue: "round",
      interpolatable: false,
      items: [
        { round: "Round" },
        { flat: "Flat" },
        { square: "Square" },
      ],
    },
    name: "End cap style",
    desc: "Shape used at the start and end of the stroke.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "blendMode",
    options: {
      initialValue: "normal",
      interpolatable: false,
      items: [
        { normal: "Normal" },
        { additive: "Additive" },
        { multiply: "Multiply" },
        { screen: "Screen" },
      ],
    },
    name: "Blend mode",
    desc: "Blend mode used when drawing the generated mesh.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "samplingMode",
    options: {
      initialValue: "auto",
      interpolatable: false,
      items: [
        { auto: "Auto" },
        { nearest: "Nearest" },
        { linear: "Linear" },
      ],
    },
    name: "Sampling mode",
    desc: "Texture sampling mode used for the stroke texture.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "debugPoints",
    options: {
      initialValue: false,
      interpolatable: false,
    },
    name: "Debug points",
    desc: "Draw control-point markers in the editor and at runtime.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "editorPreview",
    options: {
      initialValue: "wireframe",
      interpolatable: false,
      items: [
        { wireframe: "Wireframe" },
        { solid: "Solid" },
        { animated: "Animated" },
      ],
    },
    name: "Editor preview",
    desc: "Controls how the line preview renders in the layout editor.",
  },
];
