export default function PresnapControls({ rep, down, yardLine, term, onDecide }) {
  const flipTo = rep.callSide === "right" ? "Left" : "Right";
  const optionsRaw = rep.callType === "run"
    ? [
        { id: "keep", label: term.run.keep, hint: `Run it as called (${rep.callSide} side)` },
        { id: "killflip", label: `${term.run.killflip} ${flipTo}`, hint: `Same run, away from the ${rep.callSide} side` },
        { id: "rpohot", label: term.run.rpohot, hint: "Bail to a quick perimeter throw" },
      ]
    : [
        { id: "checkdown", label: term.pass.checkdown, hint: "0\u20134 yards, safe" },
        { id: "short", label: term.pass.short, hint: "5\u20139 yards" },
        { id: "intermediate", label: term.pass.intermediate, hint: "10\u201319 yards" },
        { id: "deep", label: term.pass.deep, hint: "20+ yards" },
      ];
  const options = optionsRaw.filter(
    (o) => rep.callType === "run" || (rep.concept.depths.includes(o.id) && !(o.id === "deep" && yardLine >= 90))
  );

  return (
    <>
      {down === 4 && <div className="urgent-flag">4th Down \u2014 staying on the field</div>}
      <div className="called-banner">
        Coach calls <span className="play">{rep.concept.name}</span> {rep.callType === "run" ? "(run)" : "(pass)"}.
      </div>
      <div className="concept-blurb">{rep.concept.blurb}</div>
      <div className="btn-grid">
        {options.map((o) => (
          <button key={o.id} className="btn" onClick={() => onDecide(o.id, o.label)}>
            {o.label}
            <span className="hint">{o.hint}</span>
          </button>
        ))}
      </div>
    </>
  );
}
