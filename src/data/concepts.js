// Flavor concepts for the huddle call. Run concepts are cosmetic.
// Pass concepts are NOT purely cosmetic: `depths` gates which of the
// four depth-bucket buttons the player can even choose, and the
// grading engine's "ideal" search (gradePass) is restricted to the
// same list — a concept can't be graded against a depth it doesn't
// actually offer.

export const RUN_CONCEPTS = [
  { name: "Inside Zone", blurb: "Zone blocking, one read on the play-side end/backer." },
  { name: "Power", blurb: "Down blocks with a puller, downhill." },
  { name: "Outside Zone", blurb: "Zone stretch to the perimeter." },
  { name: "Duo", blurb: "Double teams up front, downhill without a puller." },
  { name: "Counter", blurb: "Misdirection, puller comes back the other way." },
];

export const PASS_CONCEPTS = [
  { name: "Mesh", blurb: "Two shallow crossers underneath. Packaged with a checkdown to the back.", depths: ["checkdown", "short"] },
  { name: "Stick", blurb: "Quick stick/flat combo. High-percentage answer to zone or pressure.", depths: ["checkdown", "short"] },
  { name: "Four Verts", blurb: "Four receivers vertical \u2014 built to attack single-high shells.", depths: ["checkdown", "intermediate", "deep"] },
  { name: "Smash", blurb: "High-low on the corner: hitch underneath, corner route over the top.", depths: ["checkdown", "short", "intermediate"] },
  { name: "Y-Cross", blurb: "Deep in-breaking route off play-action, built to split two-deep zones.", depths: ["checkdown", "intermediate", "deep"] },
  { name: "Curl-Flat", blurb: "Curl and flat combo underneath, packaged with a checkdown.", depths: ["checkdown", "short", "intermediate"] },
];
