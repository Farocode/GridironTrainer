// Offensive personnel groupings. `strongDefault` is the side the
// formation's extra skill player (TE / trips) sits on before any
// mirroring; formationMath.personnelFor() flips it to match the
// rep's actual call side. `blockers` feeds directly into run grading
// (see engine/grading.js gradeRun) — it is not cosmetic.
//
// Each skill-position entry is either:
//   - a backfield player (QB/RB/FB/HB) with an explicit y, or
//   - a TE/WR with a `line` boolean (true = on the line of
//     scrimmage, false = off the line / flexed or slot) whose y is
//     resolved by formationMath.personnelFor().

export const OFFENSE_FORMATIONS = {
  p12: {
    name: "12 Personnel", desc: "1 RB, 2 TE", blockers: 7,
    strengthWord: "TE Strong", strongDefault: "right", shotgunProb: 0.55, qbShotgunY: 270,
    personnel: [
      { x: 200, r: "QB" },
      { x: 200, y: 246, r: "RB" },
      { x: 100, r: "TE", line: false },
      { x: 300, r: "TE", line: true },
      { x: 40, r: "WR", line: true },
      { x: 360, r: "WR", line: true },
    ],
  },
  p21: {
    name: "21 Personnel", desc: "2 RB, 1 TE \u2014 Power I", blockers: 7,
    strengthWord: "I-Strong", strongDefault: "right", shotgunProb: 0.4, qbShotgunY: 268,
    personnel: [
      { x: 200, r: "QB" },
      { x: 178, y: 240, r: "FB" },
      { x: 225, y: 248, r: "RB" },
      { x: 320, r: "TE", line: true },
      { x: 40, r: "WR", line: true },
      { x: 360, r: "WR", line: true },
    ],
  },
  p11: {
    name: "11 Personnel", desc: "1 RB, 1 TE, 3 WR", blockers: 6,
    strengthWord: "Trips", strongDefault: "right", shotgunProb: 0.85, qbShotgunY: 268,
    personnel: [
      { x: 200, r: "QB" },
      { x: 200, y: 244, r: "RB" },
      { x: 310, r: "TE", line: true },
      { x: 40, r: "WR", line: true },
      { x: 360, r: "WR", line: true },
      { x: 280, r: "WR", line: false },
    ],
  },
  p10: {
    name: "10 Personnel", desc: "1 RB, 4 WR \u2014 spread", blockers: 5,
    strengthWord: "Trips", strongDefault: "right", shotgunProb: 0.95, qbShotgunY: 270,
    personnel: [
      { x: 200, r: "QB" },
      { x: 200, y: 246, r: "RB" },
      { x: 20, r: "WR", line: true },
      { x: 260, r: "WR", line: false },
      { x: 320, r: "WR", line: false },
      { x: 380, r: "WR", line: true },
    ],
  },
  p20: {
    name: "20 Personnel", desc: "2 RB, 0 TE \u2014 flexbone", blockers: 6,
    strengthWord: "Wing Strong", strongDefault: "right", shotgunProb: 0.5, qbShotgunY: 274,
    personnel: [
      { x: 200, r: "QB" },
      { x: 200, y: 246, r: "FB" },
      { x: 155, y: 236, r: "HB" },
      { x: 285, y: 236, r: "HB" },
      { x: 30, r: "WR", line: true },
      { x: 370, r: "WR", line: true },
    ],
  },
};

export const OFFENSE_STYLES = [
  { id: "airraid", name: "Air Raid", blurb: "Spread, tempo, pass-heavy.", runProb: 0.25, formationPool: ["p10", "p11"] },
  { id: "groundpound", name: "Ground & Pound", blurb: "Pro-style, physical, run it right at people.", runProb: 0.70, formationPool: ["p21", "p12"] },
  { id: "balanced", name: "Balanced Spread / RPO", blurb: "Keep the defense honest, take what's given.", runProb: 0.45, formationPool: ["p11", "p12"] },
  { id: "option", name: "Flexbone Option", blurb: "Ground-based misdirection. Rarely throws deep.", runProb: 0.78, formationPool: ["p20", "p21"] },
];
