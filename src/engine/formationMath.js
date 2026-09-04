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
    let x = mirror ? 400 - p.x : p.x;
    let y = p.y;
    if (p.r === "QB") y = shotgun ? formation.qbShotgunY : 216;
    else if (y === undefined) y = p.line ? 214 : 232;
    if (p.gunOffset && shotgun) {
      // Single-back shotgun sets: the back lines up BESIDE the QB,
      // not stacked directly in front of him on the same line.
      // Offset to the weak side (away from formation strength) — a
      // common convention, though real playbooks vary on this and
      // sometimes use the offset itself as a pre-snap tell.
      const dx = 30;
      x = callSide === "right" ? x - dx : x + dx;
    }
    return { ...p, x, y };
  });
}

/**
 * Box count generation. Deliberately tied to the TRUE safety count
 * (not the pre-snap shown one, since disguise only changes depth/
 * alignment, not personnel grouping) and bounded per shell so total
 * defenders on screen (box[DL+LB combined] + CB 2 + S[1 or 2]) always
 * lands in a realistic ~10-12 range. An earlier version rolled box
 * count from an independent random draw uncorrelated with the
 * safety count being displayed, which produced reps with as few as
 * 8 visible defenders — this function fixes that.
 *
 * `box` is the combined DL+LB count, same as always — pickDLCount
 * (below) only decides how that same total splits between the two
 * rows for display, so this range guarantee is untouched by that.
 */
export function computeBox(mofoActual, boxBias, blitz, randInt) {
  if (blitz) return randInt(8, 9);
  const [lo, hi] = mofoActual ? [6, 8] : [7, 9];
  const base = mofoActual ? randInt(6, 7) : randInt(7, 8);
  return Math.max(lo, Math.min(hi, base + boxBias));
}

/**
 * Front size (DL count) for the rep, weighted rather than uniform —
 * a 4-man front is the most common look, 3-man fairly common, 5-man
 * rare (short-yardage / goal-line). LB count is then whatever's left
 * of `box` after DL is subtracted (see FieldView.jsx), so this and
 * computeBox together still land on exactly `box` total front+backer
 * defenders — this only decides how that total is split into the two
 * rows. `rand` defaults to Math.random and is injectable for tests.
 */
export function pickDLCount(rand = Math.random) {
  const r = rand();
  if (r < 0.35) return 3;
  if (r < 0.90) return 4;
  return 5;
}


/**
 * Safety positions for the shell being rendered. MOFC (single-high)
 * sits shallower than MOFO (two-deep split) because there's only one
 * body to cover the deep middle. `nudge` applies the disguise-tell
 * visual offset to one safety (see App.jsx `drawRep`) and is optional.
 *
 * Pulled out of FieldView.jsx so the actual on-screen geometry is a
 * pure function tests can call directly, instead of coordinates
 * living only inline in JSX (see tests/grading.test.js "no dead
 * space" regression test).
 */
export function safetyPositions(shown, nudge) {
  const base = shown.blitz
    ? []
    : shown.mofo
    ? [{ x: 150, y: 26, role: "S" }, { x: 250, y: 26, role: "S" }]
    : [{ x: 200, y: 18, role: "S" }];
  return base.map((s, i) =>
    nudge && nudge.index === i ? { ...s, x: s.x + nudge.dx, y: s.y + nudge.dy, tell: true } : s
  );
}

/**
 * Positions linebackers near the line of scrimmage, shifted left or
 * right to visually represent which side the extra box defender(s)
 * are stacked toward. This is the ONLY place stackSide is expressed —
 * deliberately visual, never labeled as text (see design notes in README).
 *
 * Shift was 35 (< 9% of the 400-unit-wide field) — too subtle to
 * actually read at a glance against a fixed, centered DL row and the
 * rest of a full defensive look ("I can't really tell if the 11th
 * unseen defender is on the right or left side"). Bumped to 60. Still
 * a pure visual read, no text — just an actually-visible one.
 */
export function lbPositions(count, stackSide) {
  if (count <= 0) return [];
  const shift = stackSide === "left" ? -60 : 60;
  const left = 130 + shift;
  const right = 270 + shift;
  const arr = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    arr.push({
      // Clamp bounds were (50, 350) — exactly the CB x-positions, so
      // an LB circle (r13) could land flush against or overlapping a
      // CB circle (also r13) instead of just short of it. Wasn't hit
      // by the diff=1, box=7-8 reps checked when the shift itself was
      // bumped to 60, but Always-11's smaller LB counts (a 5-man
      // front can leave just 1-2 backers) reach the shifted extremes
      // more often, where it DID show up as two overlapping labels.
      // (95, 305) keeps at least a ~19-unit gap from either CB edge.
      x: Math.max(95, Math.min(305, left + t * (right - left))),
      y: 176 + (i % 2 === 0 ? 0 : 8),
      role: "LB",
    });
  }
  return arr;
}

/**
 * X positions for a variable-size DL row, evenly spread across the
 * same 162-238 span the old fixed 4-man front used (unlike LB, the
 * DL row doesn't lean with stackSide — real fronts don't shift with
 * the extra box defender the way linebacker depth/alignment does).
 */
export function dlPositions(count) {
  if (count <= 0) return [];
  if (count === 1) return [200];
  const span = 76; // 238 - 162, the original front's outer spread
  const left = 200 - span / 2;
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, i) => left + i * step);
}
