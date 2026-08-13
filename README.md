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

## Backlog (deliberately deferred, not forgotten)

- **Device-chooser landing screen** (pick Desktop / Phone / Tablet
  before entering the trainer, to make the demo link look intentional
  regardless of viewer's device). Logged as a future idea, not
  needed for the current beta-sharing plan (see Deploying above),
  which just relies on the frame already being phone-shaped.
- **Feedback phrasing is still a bit wooden and repetitive** despite
  the variant system. Logged for a future pass to make it sound more
  like actual coach-speak rather than templated sentences with swapped
  numbers.
- **Always-11 defense with a variable front (3/4/5-man DL, weighted to
  a side) instead of a fixed 4-man line.** Explicitly deprioritized —
  design decision, not an oversight: safety count (MOFO/MOFC) is the
  first and most important read in the whole progression, and front
  variation is texture on top of the box-count read, not a new skill
  the trainer should be teaching yet. Don't build this until the core
  safety/box/leverage progression is solid and tested. When it's time:
  the current `computeBox()` bounds the total to ~10-12 as an
  approximation; a true fix makes DL count variable and derives
  `LB = 11 - DL - CB(2) - Safeties(1 or 2)` so the total is always
  exactly 11 by construction, not a range.

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
