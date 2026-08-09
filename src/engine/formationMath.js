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
    if (p.r === "QB") y = shotgun ? formation.qbShotgunY : 420;
    else if (y === undefined) y = p.line ? 403 : 392;
    return { ...p, x, y };
  });
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
      y: 355 + (i % 2 === 0 ? 0 : 9),
      role: "LB",
    });
  }
  return arr;
}
