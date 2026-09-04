# Gridiron Read Trainer

A pre-snap decision trainer for QBs (HS/lower-college level). You get a
down/distance/field situation, a formation, a huddle call, and a
defensive look — you make the correct check (run: Keep / Kill-Flip /
RPO-Hot, pass: Checkdown / Short / Intermediate / Deep) and get graded
Ideal / Acceptable / Misread with a film-note explanation.

It is **not** a scoreboard game. The drive exists only to keep
generating varied down/distance/field-position situations. The thing
that matters is decision quality, tracked as a running session tally.

## Getting started

```bash
npm install
npm run dev       # local dev server with hot reload
npm test          # runs the grading engine test suite
npm run build     # production build
```

## Project structure

```
src/
  engine/          Pure logic. No React, no JSX. Fully unit-testable.
    grading.js       The core: gradeRun, gradePass, priorityList, and
                      all feedback phrase banks. If you're tuning what
                      counts as a correct read, this is the file.
    formationMath.js  Strong-side mirroring, linebacker cluster math.
    utils.js          Small helpers (field position labels, etc).

  data/            Content. Edit these to add/change what the app
                    teaches, without touching any logic.
    coordinators.js   Defensive coordinator archetypes (tendencies a
                      shell is generated from each rep).
    formations.js     Offensive personnel groupings + OFFENSE_STYLES.
    concepts.js       Run/pass concept flavor names + which pass
                      depths each concept actually offers.
    terminology.js    Display-label presets (Standard / Alert System
                      / Simplified). Grading always uses internal ids
                      (keep/killflip/rpohot, checkdown/short/...) —
                      this file only ever changes what's shown.

  hooks/
    useVariantPicker.js  Picks feedback phrasing without repeating
                          the same sentence twice in a row.

  components/      UI only. Should contain no grading logic — if
                    you're writing an if/else that decides whether a
                    read was correct, it belongs in src/engine, not
                    here.

tests/
  grading.test.js  Regression tests for the engine. Run before
                    trusting any change to grading.js.
```

## Why procedural defenses, not a fixed coverage library

Early versions picked from ~10 hardcoded named coverages (Cover 2,
Cover 3, Tampa 2, etc). That made "box count" and "leverage" flavor
text attached to a name, rather than something that actually drove
the read. The current model generates each rep from four atomic
values — MOFO/MOFC, press/off, blitz, box count — off a coordinator's
tendencies. This is what makes the HUD's "Blockers v Box" number and
the visual safety-shell/leverage read mean something mechanically,
instead of just being labeled.

## Known simplifications (read before "fixing" these)

These were deliberate scope calls, not oversights — flagged here so a
future contributor doesn't "fix" them into more complexity than the
tool needs:

- **Only MOFO/MOFC is ever disguised.** Leverage (press/off) and
  blitz are always shown truthfully. Real disguise can involve
  leverage changing late too; we scoped disguise to the single most
  teachable axis.
- **Box count is always accurate**, never disguised. Only *which side*
  it's stacked toward is a pure visual read (see `formationMath.js`
  `lbPositions` — the stack side is expressed only as an x-shift in
  the diagram, never as text).
- **The pass depth priority table (`priorityList` in `grading.js`) is
  one reasonable coaching philosophy, not settled doctrine.** Two
  cells in particular are genuine judgment calls worth sanity-checking
  against real staff input:
  - MOFC + off coverage: currently ranks Short over Intermediate as
    the ideal answer. A real case exists for the Cover 3 "hole shot"
    (a deep intermediate seam) being the correct textbook answer
    instead.
  - MOFO + press coverage: currently ranks Short as ideal. A case
    exists for Intermediate given the vacated middle behind a
    two-deep man shell.
  If you have real coaching input on these, update the relevant
  branch in `priorityList()` and add/adjust the corresponding test in
  `tests/grading.test.js`.
- **Run grading treats all blocking schemes the same.** A 7-in-the-box
  look is genuinely fine in some zone schemes with a built-in answer
  (bubble/RPO tag) and genuinely bad in others (gap scheme, no
  answer). The model doesn't distinguish blocking scheme — it's a
  simplification, not a law of football.
- **Hot routes (a single predetermined receiver's job changing
  against pressure) were explicitly scoped out.** Mechanically it's
  close to what Checkdown/RPO-Hot already represent; adding
  player-level targeting would be a real complexity jump. Revisit if
  it turns out to matter in testing.
- **Terminology presets are fixed, not yet user-editable.** Coaches
  can pick from three presets (`terminology.js`) but can't type their
  own custom labels yet. Planned as a future addition once the fixed
  presets prove insufficient in practice.

## Fixed since initial scaffold

- **Shotgun sets had the RB stacked directly on the QB's x-coordinate**,
  reading as "the back lined up in front of the QB." Single-back
  formations (`p12`, `p11`, `p10`, marked `gunOffset: true`) now offset
  the RB to the weak side in shotgun; under center it correctly stays
  in-line (that alignment was already realistic). `p21` (I-form, fixed
  FB) and `p20` (flexbone, fixed wing alignment) intentionally untouched.
- **Blockers-vs-Box was grouped with situational game state** (down,
  distance, field position) in the top HUD, when it's actually part of
  the pre-snap read, same family as shell and personnel. Moved to its
  own always-visible strip next to the shell/personnel readbox — still
  never gated behind training wheels, since that was a deliberate
  earlier decision (box count is given, unlike MOFO/MOFC and leverage
  which stay a pure visual read).

- **Dash escape bug, for real this time.** An earlier fix was claimed
  but never actually applied to the split files — `\u2014` was left
  sitting in raw JSX text (which doesn't interpret JS escapes) in
  `ScoutingReport.jsx`, `PresnapControls.jsx`, and `SetupScreen.jsx`.
  All three now use a literal em dash character. If you ever see
  `\u2014` rendered literally on screen again, grep for `\\u` in
  `src/components/*.jsx` outside of quotes/backticks — that pattern
  is always safe inside a JS string, never safe as bare JSX text.
- **On-line vs. off-line receiver depth was inverted.** Off-line
  (flexed/slot) players were placed *closer* to the LOS than on-line
  players — actually on the defensive side of the line, overlapping
  the DL row. Fixed in `formationMath.js`; see the regression tests
  in `tests/grading.test.js`.
- **Box count was decorrelated from the safety count being shown.**
  It was rolled from an independent random draw, so reps could show
  as few as 8 or as many as 13 total defenders. `computeBox()` now
  ties box count to the *true* safety count (disguise only changes
  depth/alignment, not personnel grouping) and bounds it so total
  defenders on screen always lands in a realistic 10-12.
- **Frame size was inconsistent between screens** (short on setup, tall
  on presnap, medium on result). `board-wrap` is now a fixed-size frame
  (mobile-first, `100dvh`-based so it doesn't jump when a phone's
  address bar shows/hides) with content scrolling inside it instead of
  the frame resizing. See `src/index.css`.
- **Field diagram had ~100px of dead space above the safeties**, on
  every single rep, because the canvas was sized for a depth no shell
  ever actually used (deepest safety never rendered above y=100 on a
  480-tall canvas). This was enough to force a scrollbar even on a 4K
  desktop monitor. Rescaled the whole diagram — canvas is now 280 tall
  instead of 480 (all coordinates in `FieldView.jsx`, `formationMath.js`,
  and `formations.js` updated together; see the depth-ordering test in
  `tests/grading.test.js`).
- **Run play calls now include a direction** (e.g. "Inside Zone Right"),
  using the same `callSide` that already drives the strong-side diagram
  marker and the Kill-Flip button's direction — no new state, just
  surfacing data that already existed. Purely a display change in
  `PresnapControls.jsx`.

## Deploying (for beta sharing)

The project auto-builds and deploys to GitHub Pages on every push to
`main` via `.github/workflows/deploy.yml`. One-time setup after this
is pushed to your repo:

1. On GitHub: repo **Settings → Pages → Source → GitHub Actions**.
2. Push to `main` (or re-run the workflow from the Actions tab).
3. Your link will be `https://<your-username>.github.io/<repo-name>/`.

The app is a phone-shaped frame by design (see `board-wrap` in
`theme.css`) — opening the link in any desktop browser already gives
you the "phone screen on a desktop" presentation without any extra
work. That's the current plan for beta sharing: one link, works as-is
in desktop Chrome/Safari or mobile Chrome.

A future "choose Desktop / Phone / Tablet" landing screen was
discussed and deliberately deferred (see Backlog) — the current fixed
phone-frame approach already covers the immediate beta-sharing goal
without that added complexity.

## Future ideas (unscoped brainstorm, not committed to)

Captured here specifically so they survive a fresh chat/context reset
— none of these are scoped or agreed to build, just worth not losing.

- **Defense version.** A genuine mirror of the current trainer: player
  sees the offense's formation/personnel and down-and-distance, and
  has to make the *defensive* call (box/leverage/coverage shell)
  instead of reading one. A lot of the data layer would transfer
  (formations, box math, strong-side concept), but the grading logic
  needs to be built fresh in the other direction. Treat as its own
  mode built on the shared data layer, not a quick reskin.
- **Opponent selection beyond a single coordinator per session** — a
  "schedule" of several coordinators in sequence, named/flavored
  opponents for realism.
- **Session summary with a diagnostic breakdown** instead of just the
  live tally — e.g. "3 of 4 misreads were box math, 1 was leverage."
  Cheap to add: `gradeRun`/`gradePass` already return a `reason`/
  `ideal` field, this would just aggregate what's already there.
- **Local persistence** (`localStorage`, no backend needed) so a
  session's stats survive a page reload. Currently everything resets.
- **Optional timed/urgency mode** — a countdown before the defense
  "snaps early," simulating real pre-snap time pressure. Explicitly
  opt-in; the default mode is deliberately unhurried pattern
  recognition.
- **Exportable/shareable session results** for a coach reviewing
  after the fact, rather than watching live.
- **Team color customization** — the chalkboard theme is centralized
  in CSS variables in `theme.css`, so this would be cheap whenever
  it's wanted.

## Backlog (deliberately deferred, not forgotten)

- **Tier colors (green/yellow/red for Ideal/Acceptable/Misread) are
  the classic red-green colorblind confusion pair** (~8% of men,
  deuteranopia/protanopia). This is a real accessibility bug, not
  just a brainstorm item — worth prioritizing over the ideas above.
  Options: shift the red toward orange/amber so it stays
  distinguishable from the green under most color-vision deficiencies,
  and/or stop relying on color alone (the tier is already spelled out
  as text — "IDEAL"/"MISREAD" — so this is mainly about the accent
  color and the field diagram's blitz-arrow red, not a text-only
  problem).

- **Device-chooser landing screen** (pick Desktop / Phone / Tablet
  before entering the trainer, to make the demo link look intentional
  regardless of viewer's device). Logged as a future idea, not
  needed for the current beta-sharing plan (see Deploying above),
  which just relies on the frame already being phone-shaped.
- **Feedback phrasing is still a bit wooden and repetitive** despite
  the variant system, and some of it is genuinely ambiguous rather
  than just plain. Two concrete examples flagged to fix when this gets
  revisited:
  - *"Given the down and distance, that needed more than it could
    reasonably get."* — "that" is unclear (the chosen depth? the
    situation?). Should instead name the actual mechanism, e.g. that
    the QB had time and routes were developing downfield, or that a
    checkdown was overly conservative given the receivers had room to
    separate.
  - *"Acceptable — Reasonable read, just short of what the situation
    demanded."* (said about throwing intermediate into an all-out
    blitz, i.e. the longest available option). Should name the actual
    risk instead — e.g. that holding the ball for a longer-developing
    route leaves the QB exposed to the rush as the play unfolds.
  General direction: explanations should read like a coach naming the
  specific mechanism (protection, leverage, time-to-throw), not a
  generic tier description with the numbers swapped in.
- **Let the player choose which defensive coordinator to face**,
  instead of always being assigned one at random at setup. Random
  assignment stays the default; add the option to pick one directly.
- ~~Always-11 defense with a variable front~~ **Built (small-scope
  version), 2026-09.** `pickDLCount()` picks a 3/4/5-man front
  (weighted 35/55/10, `formationMath.js`), `dlPositions()` renders it,
  and LB count is `box - dlCount` — real labels on every front
  defender instead of 4 anonymous DL dots. Deliberately did NOT do the
  bigger version once described here (nickel/dime packages, CB count
  varying up to 5-6 DBs, or deriving an exactly-11-by-construction
  total) — that's a real personnel-package system, a genuine scope
  jump, and explicitly punted per Michael's standing "keep this small"
  direction (see session log). `computeBox()`'s total-defenders range
  is unchanged (still the same ~10-12 approximation as before, not
  forced to exactly 11) — this only changed how that same total is
  split into DL vs LB for display, not the underlying box math.

## Extending


- **Add a coordinator:** add an entry to `data/coordinators.js` with
  `mofoProb`, `pressProb`, `blitzProb`, `boxBias` (roughly -1 to +1),
  and optionally `disguises`/`disguiseNote`.
- **Add a pass concept:** add an entry to `data/concepts.js` with a
  `depths` array — only include depths the route actually offers.
- **Add a terminology preset:** add an entry to `data/terminology.js`
  matching the shape of the existing presets. Nothing in `engine/`
  needs to change.
- **Tune a grading rule:** everything lives in `src/engine/grading.js`.
  Run `npm test` after any change — the test suite exhaustively
  checks that exactly one run option and one pass depth grade Ideal
  per situation, and that Deep is never legal inside the 10.
