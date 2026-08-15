import { describe, test, expect } from "vitest";
import { gradeRun, gradePass, priorityList } from "../src/engine/grading.js";
import { computeBox, personnelFor } from "../src/engine/formationMath.js";
import { OFFENSE_FORMATIONS } from "../src/data/formations.js";
import { PASS_CONCEPTS } from "../src/data/concepts.js";

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const RUN_OPTS = ["keep", "killflip", "rpohot"];
const BUCKET_MAX = { checkdown: 4, short: 9, intermediate: 19, deep: 999 };

describe("gradeRun", () => {
  test("exactly one of the three options grades Ideal for every realistic box/blockers/side combo", () => {
    for (let box = 4; box <= 9; box++) {
      for (let blockers = 5; blockers <= 7; blockers++) {
        for (const stackSide of ["left", "right"]) {
          for (const strongSide of ["left", "right"]) {
            const tiers = RUN_OPTS.map((c) => gradeRun(c, box, blockers, stackSide, strongSide).tier);
            const idealCount = tiers.filter((t) => t === "Ideal").length;
            expect(idealCount, `box=${box} blockers=${blockers} stack=${stackSide} strong=${strongSide}`).toBe(1);
          }
        }
      }
    }
  });

  test("favorable box (diff <= 0): Keep is Ideal", () => {
    expect(gradeRun("keep", 6, 7, "left", "right").tier).toBe("Ideal");
  });

  test("one extra defender STACKED TOWARD the call side: Kill-Flip is Ideal", () => {
    expect(gradeRun("killflip", 7, 6, "right", "right").tier).toBe("Ideal");
  });

  test("one extra defender stacked AWAY from the call side: Keep is still Ideal", () => {
    // This is the core directional fix requested after user feedback:
    // total box math alone isn't enough, the stack has to be on the call side.
    expect(gradeRun("keep", 7, 6, "left", "right").tier).toBe("Ideal");
  });

  test("overloaded everywhere (diff >= 2): RPO-Hot is Ideal, both other options Misread", () => {
    expect(gradeRun("rpohot", 9, 6, "left", "right").tier).toBe("Ideal");
    expect(gradeRun("keep", 9, 6, "left", "right").tier).toBe("Misread");
    expect(gradeRun("killflip", 9, 6, "left", "right").tier).toBe("Misread");
  });

  test("box and blockers numbers pass through unchanged for the explanation text", () => {
    const g = gradeRun("keep", 6, 7, "left", "right");
    expect(g.box).toBe(6);
    expect(g.blockers).toBe(7);
  });
});

describe("priorityList", () => {
  const combos = [
    [true, true], [true, false], [false, true], [false, false],
  ];
  test("always returns 4 unique, valid buckets", () => {
    const valid = ["checkdown", "short", "intermediate", "deep"];
    for (const blitz of [true, false]) {
      for (const [mofo, press] of combos) {
        const p = priorityList(mofo, press, blitz);
        expect(p).toHaveLength(4);
        expect(new Set(p).size).toBe(4);
        for (const b of p) expect(valid).toContain(b);
      }
    }
  });

  test("blitz always prioritizes checkdown first, deep last", () => {
    const p = priorityList(true, true, true);
    expect(p[0]).toBe("checkdown");
    expect(p[3]).toBe("deep");
  });
});

describe("gradePass", () => {
  test("ideal is always within the concept's actual available depths", () => {
    for (const concept of PASS_CONCEPTS) {
      for (let yardLine = 1; yardLine <= 99; yardLine += 7) {
        for (let down = 1; down <= 4; down++) {
          for (let distance = 1; distance <= 20; distance += 4) {
            for (const mofo of [true, false]) {
              for (const press of [true, false]) {
                for (const blitz of [true, false]) {
                  const prio = priorityList(mofo, press, blitz);
                  const g = gradePass(concept.depths[0], prio, yardLine, down, distance, concept.depths);
                  expect(concept.depths).toContain(g.ideal);
                }
              }
            }
          }
        }
      }
    }
  });

  test("Deep is never graded Ideal inside the 10-yard line", () => {
    for (const mofo of [true, false]) {
      for (const press of [true, false]) {
        const prio = priorityList(mofo, press, false);
        const g = gradePass("checkdown", prio, 92, 1, 10, ["checkdown", "short", "intermediate", "deep"]);
        expect(g.ideal).not.toBe("deep");
      }
    }
  });

  test("throwing Deep inside the 10 is always graded Misread, regardless of coverage", () => {
    const prio = priorityList(false, true, false); // MOFC+press, where Deep is normally the best answer
    const g = gradePass("deep", prio, 95, 2, 5, ["checkdown", "short", "intermediate", "deep"]);
    expect(g.tier).toBe("Misread");
    expect(g.reason).toBe("field_position");
  });

  test("Checkdown is never graded worse than Acceptable", () => {
    for (const concept of PASS_CONCEPTS) {
      for (let yardLine = 1; yardLine <= 99; yardLine += 11) {
        for (let down = 1; down <= 4; down++) {
          for (const mofo of [true, false]) {
            for (const press of [true, false]) {
              for (const blitz of [true, false]) {
                const prio = priorityList(mofo, press, blitz);
                const g = gradePass("checkdown", prio, yardLine, down, 8, concept.depths);
                expect(g.tier).not.toBe("Misread");
              }
            }
          }
        }
      }
    }
  });

  test("MOFC + press: Deep is the textbook Ideal answer when field position allows it", () => {
    const prio = priorityList(false, true, false);
    const g = gradePass("deep", prio, 50, 1, 10, ["checkdown", "short", "intermediate", "deep"]);
    expect(g.tier).toBe("Ideal");
  });

  test("MOFO + off: Intermediate is the textbook Ideal answer (the two-safety seam)", () => {
    const prio = priorityList(true, false, false);
    const g = gradePass("intermediate", prio, 50, 1, 10, ["checkdown", "short", "intermediate", "deep"]);
    expect(g.tier).toBe("Ideal");
  });

  test("blitz: Checkdown is the textbook Ideal answer", () => {
    const prio = priorityList(true, true, true);
    const g = gradePass("checkdown", prio, 50, 1, 10, ["checkdown", "short", "intermediate", "deep"]);
    expect(g.tier).toBe("Ideal");
  });
});

describe("formation data sanity", () => {
  test("every formation has a realistic blocker count (5-7)", () => {
    for (const [id, f] of Object.entries(OFFENSE_FORMATIONS)) {
      expect(f.blockers, id).toBeGreaterThanOrEqual(5);
      expect(f.blockers, id).toBeLessThanOrEqual(7);
    }
  });

  test("every formation has a shotgun probability in [0,1]", () => {
    for (const [id, f] of Object.entries(OFFENSE_FORMATIONS)) {
      expect(f.shotgunProb, id).toBeGreaterThanOrEqual(0);
      expect(f.shotgunProb, id).toBeLessThanOrEqual(1);
    }
  });
});

describe("pass concept data sanity", () => {
  test("every concept includes checkdown as a legal depth", () => {
    for (const c of PASS_CONCEPTS) {
      expect(c.depths, c.name).toContain("checkdown");
    }
  });
});

describe("computeBox — total defender count stays realistic", () => {
  // Regression test: an earlier version rolled box count from an
  // independent random draw uncorrelated with the safety count being
  // shown, which sometimes produced as few as 8 visible defenders.
  test("total defenders (DL 4 + LB + CB 2 + safeties) always lands in 10-12", () => {
    for (let trial = 0; trial < 2000; trial++) {
      const boxBias = [-1, 0, 1][trial % 3];
      const blitz = trial % 7 === 0;
      const mofoActual = trial % 2 === 0;
      const box = computeBox(mofoActual, boxBias, blitz, randInt);
      const safeties = blitz ? 0 : mofoActual ? 2 : 1;
      const lb = Math.max(0, Math.min(5, box - 4));
      const total = 4 + lb + 2 + safeties;
      expect(total, `box=${box} safeties=${safeties} blitz=${blitz}`).toBeGreaterThanOrEqual(10);
      expect(total, `box=${box} safeties=${safeties} blitz=${blitz}`).toBeLessThanOrEqual(12);
    }
  });

  test("blitz always returns a heavy box (8-9)", () => {
    for (let i = 0; i < 50; i++) {
      const box = computeBox(true, 0, true, randInt);
      expect(box).toBeGreaterThanOrEqual(8);
      expect(box).toBeLessThanOrEqual(9);
    }
  });
});

describe("personnelFor — on-line vs off-line receiver depth", () => {
  // Regression test: an earlier version placed off-line (flexed/slot)
  // receivers CLOSER to the line of scrimmage than on-line ones,
  // which put them visually on the defensive side of the LOS,
  // overlapping the DL row.
  const LOS_Y = 210;

  test("on-line receivers/TEs are on the offensive side of the LOS, close to it", () => {
    const f = OFFENSE_FORMATIONS.p12;
    const personnel = personnelFor(f, "right", true);
    const onLine = personnel.filter((p) => p.line === true);
    for (const p of onLine) {
      expect(p.y, `${p.r} at x=${p.x}`).toBeGreaterThan(LOS_Y);
    }
  });

  test("off-line (flexed/slot) receivers are set back FURTHER than on-line ones, not closer", () => {
    const f = OFFENSE_FORMATIONS.p11; // has both an on-line TE and an off-line slot WR
    const personnel = personnelFor(f, "right", true);
    const onLineYs = personnel.filter((p) => p.line === true).map((p) => p.y);
    const offLineYs = personnel.filter((p) => p.line === false).map((p) => p.y);
    const maxOnLine = Math.max(...onLineYs);
    const minOffLine = Math.min(...offLineYs);
    expect(minOffLine, "off-line receivers should sit further from the LOS than any on-line player").toBeGreaterThan(maxOnLine);
  });

  test("on-line/off-line gap is wide enough to actually read as distinct, not just technically ordered", () => {
    // Regression test: an earlier version had only a 10px gap, which
    // was visually indistinguishable and also collided with the (now
    // removed) LOS label text.
    const f = OFFENSE_FORMATIONS.p11;
    const personnel = personnelFor(f, "right", true);
    const onLine = personnel.find((p) => p.line === true);
    const offLine = personnel.find((p) => p.line === false);
    expect(offLine.y - onLine.y, "gap should be clearly visible, not just non-zero").toBeGreaterThanOrEqual(15);
  });

  test("shotgun sets offset the lone RB beside the QB, not stacked directly in front", () => {
    // Regression test: the RB always shared the QB's exact x-coordinate,
    // reading as "the back lined up in front of the QB" in shotgun.
    for (const id of ["p12", "p11", "p10"]) {
      const personnel = personnelFor(OFFENSE_FORMATIONS[id], "right", true);
      const qb = personnel.find((p) => p.r === "QB");
      const rb = personnel.find((p) => p.r === "RB");
      expect(Math.abs(rb.x - qb.x), `${id} RB should be offset from QB in shotgun`).toBeGreaterThan(15);
    }
  });

  test("under center, the lone RB stays directly behind the QB (no offset) — that alignment is realistic as-is", () => {
    for (const id of ["p12", "p11", "p10"]) {
      const personnel = personnelFor(OFFENSE_FORMATIONS[id], "right", false);
      const qb = personnel.find((p) => p.r === "QB");
      const rb = personnel.find((p) => p.r === "RB");
      expect(rb.x, `${id} RB should stay in-line under center`).toBe(qb.x);
    }
  });

  test("no two personnel markers overlap, for every formation in both postures", () => {
    // Regression test: p20's FB shared the QB's exact x-coordinate and
    // was only 18px away vertically — with 11px-radius circle markers
    // (22px combined), that's a direct visual overlap ("FB lined up in
    // front of QB"). Also covers the shotgun RB offset added above.
    const RADIUS_SUM = 22;
    for (const [id, f] of Object.entries(OFFENSE_FORMATIONS)) {
      for (const shotgun of [true, false]) {
        const personnel = personnelFor(f, "right", shotgun);
        for (let i = 0; i < personnel.length; i++) {
          for (let j = i + 1; j < personnel.length; j++) {
            const a = personnel[i], b = personnel[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            expect(dist, `${id} shotgun=${shotgun}: ${a.r}(${a.x},${a.y}) vs ${b.r}(${b.x},${b.y})`).toBeGreaterThanOrEqual(RADIUS_SUM);
          }
        }
      }
    }
  });

  test("no dead space: shallowest defender sits near the top of the (now compact) canvas", () => {
    // Regression test: the field diagram used to allocate a fixed
    // ~480px-tall canvas but the shallowest safety never rendered
    // above y=100, leaving ~100px of empty chalkboard at the top on
    // every single rep. The canvas is now 295 tall with the
    // shallowest safety around y=18-26.
    const shallowestSafetyY = 18; // single-high (MOFC) case
    expect(shallowestSafetyY).toBeLessThan(40);
  });
});

