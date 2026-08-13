// Pure geometry helpers for the field diagram. No React.

/**
 * Returns the offense's personnel with x-coordinates mirrored when the
 * call side doesn't match the formation's default strong side, and
 * y-coordinates resolved for QB depth (shotgun vs under center) and
 * receiver/TE depth (on the line vs off the line / flexed).
 */
export function personnelFor(formation, callSide, shotgun) {
  const mirror = callSide !== formation.strongDefault;
  return formation.personnel.map((p) => {
    const x = mirror ? 400 - p.x : p.x;
    let y = p.y;
    if (p.r === "QB") y = shotgun ? formation.qbShotgunY : 216;
    else if (y === undefined) y = p.line ? 214 : 232;
    return { ...p, x, y };
  });
}

/**
 * Box count generation. Deliberately tied to the TRUE safety count
 * (not the pre-snap shown one, since disguise only changes depth/
 * alignment, not personnel grouping) and bounded per shell so total
 * defenders on screen (DL 4 + LB[box-4] + CB 2 + S[1 or 2]) always
 * lands in a realistic ~10-12 range. An earlier version rolled box
 * count from an independent random draw uncorrelated with the
 * safety count being displayed, which produced reps with as few as
 * 8 visible defenders — this function fixes that.
 */
export function computeBox(mofoActual, boxBias, blitz, randInt) {
  if (blitz) return randInt(8, 9);
  const [lo, hi] = mofoActual ? [6, 8] : [7, 9];
  const base = mofoActual ? randInt(6, 7) : randInt(7, 8);
  return Math.max(lo, Math.min(hi, base + boxBias));
}


/**
 * Positions linebackers near the line of scrimmage, shifted left or
 * right to visually represent which side the extra box defender(s)
 * are stacked toward. This is the ONLY place stackSide is expressed —
 * deliberately visual, never labeled as text (see design notes in README).
 */
export function lbPositions(count, stackSide) {
  if (count <= 0) return [];
  const shift = stackSide === "left" ? -35 : 35;
  const left = 130 + shift;
  const right = 270 + shift;
  const arr = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    arr.push({
      x: Math.max(50, Math.min(350, left + t * (right - left))),
      y: 176 + (i % 2 === 0 ? 0 : 8),
      role: "LB",
    });
  }
  return arr;
}
