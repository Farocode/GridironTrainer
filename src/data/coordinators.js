// Defensive coordinator archetypes. Each rep's shell (MOFO/MOFC,
// press/off, blitz, box count) is generated from these probabilities
// rather than picked from a fixed library of named coverages — see
// README "Why procedural, not a coverage library".

export const COORDINATORS = [
  {
    id: "vanilla",
    name: "Read-and-React Coordinator",
    blurb: "Lines up in what they run. Balanced shells, rarely presses, almost never blitzes.",
    mofoProb: 0.5, pressProb: 0.25, blitzProb: 0.05, boxBias: 0,
    disguises: false,
  },
  {
    id: "blitzheavy",
    name: "Aggressive Blitz-Heavy Coordinator",
    blurb: "Presses corners and brings extra rushers more than anyone on the schedule. Boxes run heavy.",
    mofoProb: 0.3, pressProb: 0.6, blitzProb: 0.32, boxBias: 1,
    disguises: true,
    disguiseNote: "Will show two-high before the snap and rotate a safety down. Watch for a safety a step closer to the line than a clean two-high shell.",
  },
  {
    id: "bendbreak",
    name: "Bend-Don't-Break Zone Coordinator",
    blurb: "Plays a lot of soft zone, off coverage, light boxes. Rarely gambles.",
    mofoProb: 0.7, pressProb: 0.1, blitzProb: 0.04, boxBias: -1,
    disguises: true,
    disguiseNote: "Will show single-high and rotate to two-high after the snap. Watch for the deep safety splitting a step wider than a true single-high alignment.",
  },
  {
    id: "matchspecialist",
    name: "Multiple Match Coordinator",
    blurb: "Mixes single- and two-high evenly, presses about half the time. The most disguise on the schedule.",
    mofoProb: 0.5, pressProb: 0.45, blitzProb: 0.15, boxBias: 0,
    disguises: true,
    disguiseNote: "Disguises in both directions. Watch the safety that doesn't quite match the rest of the shell.",
  },
];
