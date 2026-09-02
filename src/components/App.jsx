import { useState, useRef, useEffect } from "react";
import { TERM_PRESETS } from "../data/terminology";
import { COORDINATORS } from "../data/coordinators";
import { OFFENSE_FORMATIONS } from "../data/formations";
import { RUN_CONCEPTS, PASS_CONCEPTS } from "../data/concepts";
import { pick, randInt, ordinal, fieldPos } from "../engine/utils";
import { priorityList, familyLabel, gradeRun, gradePass, runExplain, passExplain, BUCKET_MID } from "../engine/grading";
import { computeBox } from "../engine/formationMath";
import { useVariantPicker } from "../hooks/useVariantPicker";
import FieldView from "./FieldView";
import SetupScreen from "./SetupScreen";
import ScoutingReport from "./ScoutingReport";
import Hud from "./Hud";
import PresnapControls from "./PresnapControls";
import ResultPanel from "./ResultPanel";
import "../theme.css";

export default function App() {
  const [phase, setPhase] = useState("setup");
  const [termId, setTermId] = useState("standard");
  const [offenseStyle, setOffenseStyle] = useState(null);
  const [coordinator, setCoordinator] = useState(null);

  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  const [yardLine, setYardLine] = useState(25);

  const [rep, setRep] = useState(null);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [showTips, setShowTips] = useState(true);
  const [stats, setStats] = useState({ Ideal: 0, Acceptable: 0, Misread: 0 });
  const logRef = useRef(null);
  const variant = useVariantPicker();
  const term = TERM_PRESETS[termId];

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [log]);

  function pushLog(entry) {
    setLog((l) => [entry, ...l].slice(0, 7));
  }

  function drawRep(style, coord) {
    const callType = Math.random() < style.runProb ? "run" : "pass";
    const formationId = pick(style.formationPool);
    const callSide = pick(["left", "right"]);
    const blitz = Math.random() < coord.blitzProb;
    const mofoShown = Math.random() < coord.mofoProb;
    const press = Math.random() < coord.pressProb;
    const stackSide = pick(["left", "right"]);
    const shotgun = Math.random() < OFFENSE_FORMATIONS[formationId].shotgunProb;
    // Independent, in-the-moment leverage read: a defender sitting
    // shallow, in zone, close to the LOS this rep. Not tied to blitz
    // (blitz already makes checkdown the correct answer on its own)
    // and not a rolling pattern \u2014 see grading.js gradePass().
    const shallowZoneDefender = Math.random() < 0.4;

    let mofoActual = mofoShown;
    let nudge = null;
    if (coord.disguises && !blitz && Math.random() < 0.45) {
      mofoActual = !mofoShown;
      nudge = mofoShown ? { index: 1, dx: -30, dy: 40 } : { index: 0, dx: 40, dy: -13 };
    }
    // Box is tied to the TRUE safety count (disguise changes depth/
    // alignment, not personnel grouping) so total defenders on screen
    // always reads as a real, coherent 11-man defense.
    const finalBox = computeBox(mofoActual, coord.boxBias, blitz, randInt);

    setRep({
      callType,
      concept: callType === "run" ? pick(RUN_CONCEPTS) : pick(PASS_CONCEPTS),
      formationId,
      callSide,
      shotgun,
      shown: { mofo: mofoShown, press, blitz, box: finalBox, stackSide, shallowZoneDefender },
      actual: { mofo: mofoActual, press, blitz, box: finalBox, stackSide, shallowZoneDefender },
      nudge,
    });
    setPhase("presnap");
  }

  function chooseOffenseStyle(style) {
    setOffenseStyle(style);
    setCoordinator(pick(COORDINATORS));
    setPhase("scouting");
  }

  function beginSession() {
    setDown(1);
    setDistance(10);
    setYardLine(25);
    setLog([]);
    setStats({ Ideal: 0, Acceptable: 0, Misread: 0 });
    drawRep(offenseStyle, coordinator);
  }

  function newDrive(spot) {
    setYardLine(spot);
    setDown(1);
    setDistance(10);
    drawRep(offenseStyle, coordinator);
  }

  function applyProgress(tier, callType, chosenBucket) {
    let gain;
    if (callType === "run") {
      gain = tier === "Ideal" ? randInt(4, 8) : tier === "Acceptable" ? randInt(1, 3) : randInt(-3, 1);
    } else {
      const mult = tier === "Ideal" ? 1 : tier === "Acceptable" ? 0.55 : 0.1;
      gain = Math.round((BUCKET_MID[chosenBucket] || 3) * mult) + randInt(-1, 1);
    }
    const turnover = tier === "Misread" && Math.random() < 0.14;
    return { gain, turnover, newYardLine: Math.max(0, Math.min(100, yardLine + gain)) };
  }

  function decide(chosen, label) {
    const { callType, actual, formationId, callSide } = rep;
    let tier, explain;

    try {
      if (callType === "run") {
        const g = gradeRun(chosen, actual.box, OFFENSE_FORMATIONS[formationId].blockers, actual.stackSide, callSide);
        tier = g.tier;
        explain = runExplain(variant, { ...g, chosen });
      } else {
        const prio = priorityList(actual.mofo, actual.press, actual.blitz);
        const g = gradePass(chosen, prio, yardLine, down, distance, rep.concept.depths, actual.shallowZoneDefender);
        tier = g.tier;
        explain = passExplain(variant, term, g, actual.mofo, actual.press, actual.blitz, label);
      }
    } catch (err) {
      // Grading threw on this rep's specific data combination. Rather
      // than freezing on a dead onClick (error boundaries don't catch
      // handler errors — see main.jsx), surface it as an ungraded rep
      // the player can move past. Doesn't touch down/distance/yardLine
      // since we never got a valid tier to apply progress from.
      console.error("Grading failed for this rep:", err, { chosen, rep });
      setResult({
        tier: "Ungraded",
        explain: "Couldn't grade that one \u2014 no harm done, doesn't count against you. On to the next rep.",
        driveNote: null,
      });
      setPhase("result");
      return;
    }


    const { gain, turnover, newYardLine } = applyProgress(tier, callType, chosen);
    setStats((s) => ({ ...s, [tier]: s[tier] + 1 }));
    const prefix = `${ordinal(down)} & ${distance} (${fieldPos(yardLine)}): `;

    if (turnover) {
      pushLog({ kind: "bad", text: `${prefix}${label} \u2014 ${tier}. Turnover.` });
      setResult({ tier, explain, turnover: true, driveNote: "Turnover \u2014 new series." });
      setPhase("result");
      return;
    }
    if (newYardLine >= 100) {
      pushLog({ kind: "good", text: `${prefix}${label} \u2014 ${tier}. Drive finishes in scoring range.` });
      setResult({ tier, explain, driveDone: true, driveNote: "Nice series \u2014 new set coming up." });
      setPhase("result");
      return;
    }
    const gained = newYardLine - yardLine;
    const madeIt = gained >= distance;
    let nextDown = down + 1;
    let nextDistance = distance - gained;
    let driveNote = null;
    if (madeIt) {
      nextDown = 1;
      nextDistance = Math.min(10, 100 - newYardLine);
      driveNote = "Moves the chains.";
    } else if (nextDown > 4) {
      pushLog({ kind: "bad", text: `${prefix}${label} \u2014 ${tier}. Turnover on downs.` });
      setYardLine(newYardLine);
      setResult({ tier, explain, driveDone: true, driveNote: "Turnover on downs \u2014 new series." });
      setPhase("result");
      return;
    }
    pushLog({ kind: tier === "Ideal" ? "good" : tier === "Misread" ? "bad" : "neutral", text: `${prefix}${label} \u2014 ${tier}.` });
    setYardLine(newYardLine);
    setDown(nextDown);
    setDistance(nextDistance);
    setResult({ tier, explain, driveNote });
    setPhase("result");
  }

  function nextRep() {
    if (result?.turnover || result?.driveDone) {
      newDrive(25);
      return;
    }
    drawRep(offenseStyle, coordinator);
  }

  const shownFamily = rep ? familyLabel(term, rep.shown.mofo, rep.shown.press, rep.shown.blitz) : "";

  return (
    <div className="board-wrap">
      <div className="inner">
        <h1 className="title">GRIDIRON READ TRAINER</h1>
        <p className="subtitle">Count the box, read the shell, make the call. Graded on decision quality.</p>

        {phase === "setup" && (
          <SetupScreen termId={termId} setTermId={setTermId} onChooseStyle={chooseOffenseStyle} />
        )}

        {phase === "scouting" && coordinator && (
          <ScoutingReport coordinator={coordinator} onBegin={beginSession} />
        )}

        {(phase === "presnap" || phase === "result") && rep && (
          <>
            <Hud down={down} distance={distance} yardLine={yardLine} />

            <FieldView
              shown={phase === "presnap" ? rep.shown : rep.actual}
              nudge={phase === "presnap" ? rep.nudge : null}
              formationId={rep.formationId}
              callSide={rep.callSide}
              shotgun={rep.shotgun}
            />

            <div className="box-strip">
              <span className="val">{OFFENSE_FORMATIONS[rep.formationId].blockers}</span>
              <span className="lbl">Blockers</span>
              <span className="vs">v</span>
              <span className="val">{rep.shown.box}</span>
              <span className="lbl">Box</span>
            </div>

            {phase === "result" && rep.callType === "run" && (() => {
              // Revealed post-result only \u2014 pre-snap, stack side stays
              // the pure visual read (LB x-shift) it's designed to be.
              const diff = rep.actual.box - OFFENSE_FORMATIONS[rep.formationId].blockers;
              if (diff <= 0) return null;
              const intoCallSide = rep.actual.stackSide === rep.callSide;
              return (
                <div className="stack-flag-row">
                  <span className="badge">+{diff} stacked {rep.actual.stackSide}</span>
                  <span className="note">{intoCallSide ? "\u2014 into the call side" : "\u2014 away from the call side"}</span>
                </div>
              );
            })()}

            {showTips && (
              <div className="readbox">
                <b>Shell:</b> {shownFamily}. <b>Personnel:</b> {OFFENSE_FORMATIONS[rep.formationId].name} ({OFFENSE_FORMATIONS[rep.formationId].strengthWord} {rep.callSide === "left" ? "Left" : "Right"}).
              </div>
            )}

            {phase === "presnap" && (
              <PresnapControls rep={rep} down={down} yardLine={yardLine} term={term} onDecide={decide} />
            )}

            {phase === "result" && result && <ResultPanel result={result} onNext={nextRep} />}

            <label className="toggle-row">
              <input type="checkbox" checked={showTips} onChange={(e) => setShowTips(e.target.checked)} />
              Show shell &amp; personnel label (training wheels)
            </label>

            <div className="log" ref={logRef}>
              {log.map((entry, i) => (
                <div key={i} className={`log-entry ${entry.kind}`}>{entry.text}</div>
              ))}
            </div>

            <div className="session-bar">
              <span>Session:</span>
              <span><b>{stats.Ideal}</b> Ideal &middot; <b>{stats.Acceptable}</b> Acceptable &middot; <b>{stats.Misread}</b> Misread</span>
            </div>

            <div className="footer-row">
              <button className="btn btn-full" onClick={() => setPhase("setup")}>New Session</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
