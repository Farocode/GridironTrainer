// ============================================================
// GRADING ENGINE
// This is the part of the app that has to be *right*, not just
// look right. Kept pure (no React, no randomness beyond what's
// explicitly passed in) so it can be exhaustively unit tested.
// See tests/grading.test.js.
// ============================================================

export const BUCKET_MAX = { checkdown: 4, short: 9, intermediate: 19, deep: 999 };
export const BUCKET_MID = { checkdown: 3, short: 7, intermediate: 14, deep: 26 };

/**
 * Given a defensive shell's properties, returns the ranked order of
 * pass depths from best to worst answer. This encodes the actual
 * football logic (safety shell + leverage -> soft spot) and is the
 * single source of truth the pass-grading and pre-snap read box both
 * draw from.
 *
 * NOTE: this table reflects one reasonable coaching philosophy, not
 * a universally agreed standard — MOFC+off and MOFO+press in
 * particular are genuine judgment calls (see README "Known
 * simplifications"). Expect to tune these with real staff input.
 */
export function priorityList(mofo, press, blitz) {
  if (blitz) return ["checkdown", "short", "intermediate", "deep"];
  if (mofo) return press
    ? ["short", "checkdown", "intermediate", "deep"]
    : ["intermediate", "checkdown", "short", "deep"];
  return press
    ? ["deep", "intermediate", "short", "checkdown"]
    : ["short", "intermediate", "checkdown", "deep"];
}

export function familyLabel(term, mofo, press, blitz) {
  if (blitz) return "an all-out blitz look";
  const fam = mofo ? term.mofo : term.mofc;
  return `${fam}, corners playing ${press ? term.press : term.off}`;
}

/**
 * Run-call grading. Ideal answer is determined by box count vs.
 * blockers, AND (for the middle case) whether the extra defender is
 * actually stacked toward the call side — Kill-Flip only makes sense
 * if there's somewhere better to flip to.
 */
export function gradeRun(chosen, box, blockers, stackSide, strongSide) {
  const diff = box - blockers;
  // `reason` records WHY `ideal` came out the way it did, distinct
  // from `ideal` itself, so the feedback copy (runExplain) can name
  // the actual mechanism instead of just restating the raw box vs.
  // blockers numbers. That matters most for "stacked_back": diff is
  // 1 (box > blockers, which on its own reads as bad for the run),
  // but the extra man is stacked away from the call side, so the
  // play side itself is still clean \u2014 "keep" is still correct, and
  // the explanation needs to say so or it looks like a contradiction.
  let ideal, reason;
  if (diff <= 0) {
    ideal = "keep";
    reason = "clean";
  } else if (diff >= 2) {
    ideal = "rpohot"; // overloaded everywhere, no side fixes it
    reason = "overloaded";
  } else if (stackSide === strongSide) {
    ideal = "killflip";
    reason = "stacked_strong";
  } else {
    ideal = "keep";
    reason = "stacked_back";
  }

  let tier;
  if (chosen === ideal) tier = "Ideal";
  else if (diff <= 0) tier = chosen === "killflip" ? "Acceptable" : "Misread";
  else if (ideal === "killflip") tier = chosen === "rpohot" ? "Acceptable" : "Misread";
  else tier = "Misread";

  return { tier, ideal, diff, box, blockers, stacked: diff >= 1, reason, stackSide, strongSide };
}

/**
 * Pass-call grading. Ideal is the best bucket in priority order that
 * is (a) actually offered by the called concept, (b) legal given
 * field position (no Deep inside the 10), and (c) — on 3rd/4th down
 * only — sufficient to plausibly reach the sticks.
 *
 * `shallowZoneDefender` is what gates checkdown out of its usual
 * safe-floor treatment: it's a real, in-the-moment leverage read for
 * THIS rep — a defender sitting shallow, in zone, close to the LOS
 * — not blitz-specific, not a rolling pattern across reps. When
 * it's true, checkdown didn't beat anybody; it got thrown right at a
 * defender sitting on it, so it's graded like any other read instead
 * of getting the automatic floor.
 */
export function gradePass(chosen, prio, yardLine, down, distance, available, shallowZoneDefender = false) {
  const deepIllegal = yardLine >= 90;
  const candidates = prio.filter((b) => available.includes(b) && !(b === "deep" && deepIllegal));
  const ideal = down >= 3
    ? (candidates.find((b) => BUCKET_MAX[b] >= distance) || candidates[0])
    : candidates[0];

  if (chosen === "deep" && deepIllegal) return { tier: "Misread", ideal, reason: "field_position" };
  if (chosen === ideal) return { tier: "Ideal", ideal, reason: null };
  if (chosen === "checkdown") {
    if (!shallowZoneDefender) return { tier: "Acceptable", ideal, reason: "conservative" };
    return { tier: "Misread", ideal, reason: "checkdown_risk" };
  }

  const idx = prio.indexOf(chosen);
  const idealIdx = prio.indexOf(ideal);
  if (idx > idealIdx && idx === prio.length - 1) return { tier: "Misread", ideal, reason: "coverage_read" };
  return { tier: "Acceptable", ideal, reason: "situational" };
}

// ---------- Feedback phrasing ----------
// Multiple variants per case so a session doesn't repeat the same
// sentence. useVariantPicker (src/hooks) avoids back-to-back repeats.

export const RUN_PHRASES = {
  ideal_keep: [
    (n) => `Numbers favored the call (${n}). Good process.`,
    (n) => `Blockers matched up clean (${n}). No reason to get off this call.`,
    (n) => `That's a numbers-advantage run (${n}) \u2014 trust it every time.`,
  ],
  ideal_killflip: [
    (n) => `Extra defender stacked to the call side (${n}). Getting off that side was right.`,
    (n) => `They loaded up where you were headed (${n}). Flipping away from it was the correct call.`,
    (n) => `Box was tilted right into your play (${n}). Good eyes getting off it.`,
  ],
  ideal_rpohot: [
    (n) => `Box was crowded everywhere (${n}). No run answer existed \u2014 getting it out fast was correct.`,
    (n) => `Numbers were bad on both sides (${n}). Nothing to flip to \u2014 right call bailing.`,
    (n) => `That's an overloaded front (${n}). Holding the ball there was never an option.`,
  ],
  acc_keep_over_flip: [
    (n) => `Numbers were actually fine (${n}) \u2014 flipping wasn't wrong, just unnecessary.`,
    (n) => `Box was manageable (${n}). No harm flipping, but you didn't need to.`,
  ],
  acc_flip_over_rpo: [
    (n) => `A flip would've worked too (${n}), but bailing wasn't wrong given the tilt.`,
    (n) => `Box supported a flip (${n}) \u2014 getting it out fast is the safe version of the same idea.`,
  ],
  bad_keep_should_flip: [
    (n) => `Ran right into the extra defender (${n}). That deficit was there before the snap.`,
    (n) => `You kept it into the loaded side (${n}). The stack was visible pre-snap.`,
    (n) => `Wrong side to stay on \u2014 the numbers advantage was clearly on the other side (${n}).`,
  ],
  bad_keep_should_rpo: [
    (n) => `Box was stacked everywhere (${n}). No run answer here \u2014 needed to get it out.`,
    (n) => `Numbers were bad across the board (${n}). Holding onto the run call didn't have an answer.`,
  ],
  bad_flip_should_rpo: [
    (n) => `Flipping sides doesn't fix an overloaded front (${n}). Needed to bail entirely.`,
    (n) => `Both sides were heavy (${n}) \u2014 there was nowhere to flip to.`,
  ],
  bad_bailed_early: [
    (n) => `You bailed on a run the numbers supported (${n}). That leaves value on the field.`,
    (n) => `Numbers were fine (${n}) \u2014 getting it out fast wasn't necessary here.`,
  ],
};

export function runExplain(pickVariant, g) {
  // Base numbers, enriched with WHY when the raw comparison alone
  // would read as backwards (diff === 1, extra man stacked away
  // from the call side \u2014 "keep" is still right, but "7 in the box
  // vs 6 blockers" on its own looks like it argues the opposite way).
  const base = `${g.box} in the box vs ${g.blockers} blockers`;
  const n = g.reason === "stacked_back"
    ? `${base}, but the extra man was stacked ${g.stackSide} \u2014 away from your ${g.strongSide} call side, so that side stayed clean`
    : g.reason === "stacked_strong"
    ? `${base}, stacked right into your ${g.strongSide} call side`
    : base;
  if (g.tier === "Ideal") return pickVariant(`run_ideal_${g.ideal}`, RUN_PHRASES[`ideal_${g.ideal}`])(n);
  if (g.tier === "Acceptable") {
    return pickVariant(`run_acc_${g.ideal}`, g.ideal === "keep" ? RUN_PHRASES.acc_keep_over_flip : RUN_PHRASES.acc_flip_over_rpo)(n);
  }
  if (g.ideal === "keep") return pickVariant("run_bad_bailed", RUN_PHRASES.bad_bailed_early)(n);
  if (g.ideal === "killflip") return pickVariant("run_bad_flip", RUN_PHRASES.bad_keep_should_flip)(n);
  return pickVariant("run_bad_rpo", g.chosen === "killflip" ? RUN_PHRASES.bad_flip_should_rpo : RUN_PHRASES.bad_keep_should_rpo)(n);
}

export const PASS_PHRASES = {
  ideal: [
    (fam, w) => `${fam} \u2014 ${w} was the window. Good process.`,
    (fam, w) => `${fam}. That's textbook ${w.toLowerCase()} \u2014 well read.`,
    (fam, w) => `${fam}. Correct depth: ${w.toLowerCase()}. Nice process.`,
    (fam, w) => `${fam} \u2014 read it before the snap and got to ${w.toLowerCase()}. That's the process working.`,
  ],
  coverage_read: [
    (fam, w, c) => `${fam} takes ${c} away. That's throwing right into their strength.`,
    (fam, w, c) => `${fam} \u2014 ${c} is exactly what that shell is built to stop.`,
    (fam, w, c) => `${fam} \u2014 that's forcing it into exactly the window they took away.`,
  ],
  conservative: [
    (fam, w, c) => `${w} was the higher-value read, but ${c} wasn't a bad process \u2014 just conservative.`,
    (fam, w, c) => `Not wrong, just leaves value out there. ${w} was there for the taking.`,
    (fam, w) => `Safe pick. You secured positive yardage, but ${w.toLowerCase()} was open underneath it.`,
    (fam, w) => `Conservative call \u2014 kept the drive moving, but ${w.toLowerCase()} was there for the taking.`,
    (fam, w) => `Low-risk pick, and there's nothing wrong with that. Just know ${w.toLowerCase()} was on the table.`,
  ],
  situational_pressure: [
    (fam, w, c) => `Held it against an all-out blitz to throw ${c.toLowerCase()} \u2014 the extra rusher was live the whole time that took to develop. That's the real risk, not the read direction.`,
    (fam, w, c) => `${w} would've gotten it out before the rush arrived. Sitting in the pocket that long into a blitz is what's exposed here.`,
  ],
  situational_distance: [
    (fam, w, c) => `The read direction wasn't wrong, but ${c.toLowerCase()} doesn't reliably reach the sticks here \u2014 down and distance needed more depth than that.`,
    (fam, w, c) => `Right idea, not enough of it. That depth is short of what this down and distance actually calls for.`,
  ],
  field_position: [
    () => `No room to throw it deep from here, regardless of coverage \u2014 that's a boundary mistake, not a read mistake.`,
    () => `Field's too short for that depth. This one's about location, not the shell.`,
  ],
  checkdown_risk: [
    (fam, w, c) => `There was a defender sitting right in that shallow window, in zone, close to the LOS \u2014 checkdown wasn't the safe outlet it looked like. ${w} was clean.`,
    (fam, w, c) => `Somebody was sitting on that checkdown the whole time \u2014 shallow, in zone, right on top of it. That's not an outlet, that's a target for them.`,
    (fam, w, c) => `The safe-looking throw had a defender camped on it. ${w} was actually the cleaner window here.`,
  ],
};

export function passExplain(pickVariant, term, g, mofo, press, blitz, chosenLabel) {
  const fam = familyLabel(term, mofo, press, blitz);
  const idealLabel = term.pass[g.ideal];
  if (g.reason === "field_position") return pickVariant("pass_fp", PASS_PHRASES.field_position)();
  if (g.tier === "Ideal") return pickVariant("pass_ideal", PASS_PHRASES.ideal)(fam, idealLabel);
  if (g.reason === "checkdown_risk") return pickVariant("pass_checkdown_risk", PASS_PHRASES.checkdown_risk)(fam, idealLabel, chosenLabel);
  if (g.reason === "coverage_read") return pickVariant("pass_cov", PASS_PHRASES.coverage_read)(fam, idealLabel, chosenLabel);
  if (g.reason === "conservative") return pickVariant("pass_cons", PASS_PHRASES.conservative)(fam, idealLabel, chosenLabel);
  // "situational" used to be one generic bucket ("that needed more
  // than it could reasonably get") regardless of WHY the pick fell
  // short. Split by mechanism: holding the ball into a live blitz is
  // a pressure-exposure risk; anywhere else it's a down/distance
  // shortfall. Different coaching point, different sentence.
  return blitz
    ? pickVariant("pass_sit_pressure", PASS_PHRASES.situational_pressure)(fam, idealLabel, chosenLabel)
    : pickVariant("pass_sit_distance", PASS_PHRASES.situational_distance)(fam, idealLabel, chosenLabel);
}
