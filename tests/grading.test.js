import { describe, test, expect } from "vitest";
import { gradeRun, gradePass, priorityList } from "../src/engine/grading.js";
import { OFFENSE_FORMATIONS } from "../src/data/formations.js";
import { PASS_CONCEPTS } from "../src/data/concepts.js";

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
