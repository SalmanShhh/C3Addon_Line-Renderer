import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
export const addonType = ADDON_TYPE.BEHAVIOR;
// `type` is ignored for behaviors but required by the config schema.
export const type = PLUGIN_TYPE.WORLD;
export const id = "salmanshh_line_renderer";
export const name = "Line Renderer";
export const version = _version;
export const minConstructVersion = undefined;
export const author = "SalmanShh";
export const website = "https://www.construct.net";
export const documentation = "https://www.construct.net";
export const description =
  "Draw a Sprite or Tiled Background as a line, rope or beam along a path of points using mesh distortion, in 2D or 3D.";
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

// Folder ids -> category names shown in the Construct event editor.
export const aceCategories = {
  Setup: "Points",
  Point_Control: "Point properties",
  Path_Building: "Lines & paths",
  Object_Following: "Objects",
  Coordinate_Space: "Co-ordinates",
  Distortion: "Distortion",
  Appearance: "Appearance",
  Performance: "Performance",
  Events: "Line",
  State_Checks: "Line",
  Values: "Line",
};

export const info = {
  // icon: "icon.svg",
  Set: {
    // COMMON to all
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    // BEHAVIOR only. The behavior owns the host object's mesh, so two copies on
    // one object would fight over it.
    IsOnlyOneAllowed: true,
  },
  // PLUGIN only (unused for behaviors, but required by the config schema)
  AddCommonACEs: {
    Position: false,
    SceneGraph: false,
    Size: false,
    Angle: false,
    Appearance: false,
    ZOrder: false,
  },
};

// NOTE: the runtime reads these by index in src/runtime/instance.js
// (_getInitProperties()). Keep the order in sync when adding/removing entries.
// "Enabled" must always stay LAST, like the built-in behaviors.
// Anything the host object already defines (image, texture tiling, line
// thickness, opacity, color, blend mode, effects) is deliberately not a property.
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
    desc: "The number of points the line starts with. They are spread across the object so it initially looks unchanged.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "coordSpace",
    options: {
      initialValue: "relative",
      interpolatable: false,
      items: [{ absolute: "Absolute (layout)" }, { relative: "Relative (object)" }],
    },
    name: "Co-ordinate space",
    desc: "Absolute uses layout co-ordinates. Relative uses co-ordinates relative to the object's position, angle and size, so the line moves with the object.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "uvScrollSpeed",
    options: {
      initialValue: 0,
      interpolatable: false,
    },
    name: "Texture scroll speed",
    desc: "How fast the image scrolls along the line, in pixels per second (Tiled Background only).",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "endCapStyle",
    options: {
      initialValue: "round",
      interpolatable: false,
      items: [
        { round: "Round" },
        { flat: "None" },
        { square: "Square" },
      ],
    },
    name: "End caps",
    desc: "The shape of the start and end of the line. None cuts off at the end point; Square and Round extend by half the thickness.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "ribbonFacing",
    options: {
      initialValue: "flat",
      interpolatable: false,
      items: [
        { flat: "Flat" },
        { billboard: "Billboard" },
        { up_vector: "Up vector" },
      ],
    },
    name: "Facing",
    desc: "How the width of the line is oriented in 3D. Flat stays in the layout plane, Billboard faces the camera, Up vector follows the up vector.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "distortAmplitude",
    options: {
      initialValue: 0,
      interpolatable: false,
      minValue: 0,
    },
    name: "Distortion amplitude",
    desc: "The maximum offset of the distortion wave, in pixels. 0 disables distortion.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "distortFrequency",
    options: {
      initialValue: 1,
      interpolatable: false,
      minValue: 0,
    },
    name: "Distortion frequency",
    desc: "The frequency of the distortion wave along the line.",
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "distortSpeed",
    options: {
      initialValue: 1,
      interpolatable: false,
    },
    name: "Distortion speed",
    desc: "How fast the distortion wave moves along the line.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "distortAxis",
    options: {
      initialValue: "both",
      interpolatable: false,
      items: [
        { x_only: "X" },
        { y_only: "Y" },
        { both: "X and Y" },
        { perpendicular: "Perpendicular" },
        { z_only: "Z elevation" },
      ],
    },
    name: "Distortion axis",
    desc: "The direction the distortion wave moves points in.",
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "distortResolution",
    options: {
      initialValue: 1,
      interpolatable: false,
      minValue: 1,
    },
    name: "Distortion resolution",
    desc: "The number of mesh subdivisions per segment. Increase for smoother distortion on long segments.",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "autoFit",
    options: {
      initialValue: false,
      interpolatable: false,
    },
    name: "Auto-fit to line",
    desc: "Move and resize the object to cover the line after each update (absolute co-ordinate space only). Keeps collisions and on-screen checks accurate for long lines.",
  },
  {
    type: PROPERTY_TYPE.COMBO,
    id: "joinStyle",
    options: {
      initialValue: "round",
      interpolatable: false,
      items: [
        { simple: "Simple" },
        { miter: "Miter" },
        { bevel: "Bevel" },
        { round: "Round" },
      ],
    },
    name: "Joins",
    desc: "How corners between segments are drawn. Simple is cheapest but thins at corners, Miter is sharp, Bevel is chipped, Round is rounded.",
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "crossSection",
    options: {
      initialValue: 2,
      interpolatable: false,
      minValue: 2,
      maxValue: 32,
    },
    name: "Cross-section points",
    desc: "The number of points around the line. 2 draws a flat ribbon; 3 or more draws a 3D tube (joins become Simple).",
  },
  {
    type: PROPERTY_TYPE.CHECK,
    id: "enabled",
    options: {
      initialValue: true,
      interpolatable: false,
    },
    name: "Enabled",
    desc: "Whether the behavior is initially enabled.",
  },
];
