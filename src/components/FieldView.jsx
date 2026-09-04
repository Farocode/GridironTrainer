import { OFFENSE_FORMATIONS } from "../data/formations";
import { personnelFor, lbPositions, safetyPositions, dlPositions } from "../engine/formationMath";

/**
 * Renders the pre-snap (or post-snap "actual") defensive look plus
 * the offense's personnel. `shown` carries the shell the player sees
 * pre-snap; when a disguise triggers, the parent passes the same
 * shape but with mofo flipped for the "actual" (post-result) render.
 */
export default function FieldView({ shown, nudge, formationId, callSide, shotgun }) {
  const formation = OFFENSE_FORMATIONS[formationId];
  const personnel = personnelFor(formation, callSide, shotgun);

  const safetiesN = safetyPositions(shown, nudge);
  const corners = [
    { x: 50, y: shown.press ? 180 : 140, role: "CB" },
    { x: 350, y: shown.press ? 180 : 140, role: "CB" },
  ];
  // dlCount defaults to 4 (the old fixed front) if a caller somehow
  // doesn't pass it, so this never divides the box up wrong.
  const dlCount = shown.dlCount ?? 4;
  const lbCount = Math.max(0, Math.min(7, shown.box - dlCount));
  const lbs = lbPositions(lbCount, shown.stackSide).map((lb) => (shown.blitz ? { ...lb, blitz: true } : lb));
  const defenders = [...safetiesN, ...corners, ...lbs];

  return (
    // viewBox height is 313 (range y=-18 to y=295). An earlier pass
    // tried to trim this as "dead space" using the wrong number — it
    // checked personnelFor's generic off-line default (y=232) and
    // missed that formations override backfield y explicitly (p21's
    // RB sits at y=248) AND that a shotgun QB drops to formation.
    // qbShotgunY (up to 270, p12/p10). With r=11 that's a real content
    // bottom of 281, not 243 — the trimmed version was clipping the
    // I-Strong RB and would've clipped a deep shotgun QB too. 295
    // leaves a real (if modest, ~14 units) margin below the actual
    // deepest content. Top margin (-18) is sized for the disguise
    // tell-ring's worst case (nudged safety + r=19 ring).
    <svg viewBox="0 -18 400 313" className="field-svg" role="img" aria-label="defensive look">
      <defs>
        <filter id="chalkRough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
        </filter>
        <filter id="chalkRoughArrow" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
        </filter>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="arrowhead" />
        </marker>
      </defs>

      {[35, 80, 125, 170].map((y) => (
        <line key={y} x1="10" y1={y} x2="390" y2={y} className="yardline" />
      ))}
      <line x1="10" y1="210" x2="390" y2="210" className="los" />
      {/* y=233 (was 222): at 222 this sat squarely inside the
          on-line outside WR's circle (y=214, r=11 -> spans 203-225)
          at the same edge x this label anchors to, so the tag was
          invisible behind the receiver rather than actually reading
          as a strong-side indicator. 233 clears the WR's bottom edge;
          off-line (flexed/slot) receivers never sit at this edge x,
          so nothing else is in this spot. */}
      <text
        x={callSide === "right" ? 385 : 15}
        y="233"
        textAnchor={callSide === "right" ? "end" : "start"}
        className="strong-label"
      >
        {callSide === "right" ? "STRONG \u2192" : "\u2190 STRONG"}
      </text>

      <g className="offense">
        {[150, 175, 200, 225, 250].map((x) => (
          <rect key={x} x={x - 4} y="206" width="8" height="5" className="ol" />
        ))}
        {personnel.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="11" className="skill" />
            <text x={p.x} y={p.y + 3.5} textAnchor="middle" className="skill-label">{p.r}</text>
          </g>
        ))}
      </g>

      <g filter="url(#chalkRough)" className="dline">
        {dlPositions(dlCount).map((x, i) => (
          <g key={i}>
            <rect x={x - 6} y="194" width="12" height="8" className="dl-mark" />
            <text x={x} y="191" textAnchor="middle" className="dl-label">DL</text>
          </g>
        ))}
      </g>

      <g filter="url(#chalkRough)">
        {defenders.map((d, i) => (
          <g key={i}>
            {d.blitz && (
              <path
                d={`M ${d.x} ${d.y} L ${d.x} ${d.y + 16}`}
                className="blitz-arrow"
                filter="url(#chalkRoughArrow)"
                markerEnd="url(#arrowhead)"
              />
            )}
            {d.tell && <circle cx={d.x} cy={d.y} r="19" className="tell-ring" />}
            <circle cx={d.x} cy={d.y} r="13" className={d.blitz ? "defender defender-blitz" : "defender"} />
            <text x={d.x} y={d.y + 4} textAnchor="middle" className="defender-label">{d.role}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
