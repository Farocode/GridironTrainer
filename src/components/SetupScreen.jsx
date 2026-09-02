import { OFFENSE_STYLES } from "../data/formations";
import { COORDINATORS } from "../data/coordinators";

/**
 * Offensive identity first (that's the primary choice — it sets your
 * run/pass tendency), defensive coordinator ("your opponent") second
 * as a quick prev/next toggle rather than a 4-wide button row: the
 * coordinator names/blurbs are long enough that cramming all four
 * into one row (like the old terminology picker did with 3 short
 * ones) would've been unreadable. Terminology picking was removed
 * entirely — the app speaks one voice (Standard) instead of asking
 * the player to pick a dialect before they've seen the app.
 */
export default function SetupScreen({ offenseStyleId, onChooseStyle, coordinator, setCoordinator }) {
  const coordIndex = COORDINATORS.findIndex((c) => c.id === coordinator.id);
  function cycle(dir) {
    const next = (coordIndex + dir + COORDINATORS.length) % COORDINATORS.length;
    setCoordinator(COORDINATORS[next]);
  }

  return (
    <div className="scout-card">
      <h3>Pick your offensive identity</h3>
      <p>This sets your run/pass tendency and personnel groupings.</p>
      {OFFENSE_STYLES.map((s) => (
        <button
          key={s.id}
          className={`btn btn-full ${offenseStyleId === s.id ? "active" : ""}`}
          onClick={() => onChooseStyle(s)}
        >
          {s.name}
          <span className="hint">{s.blurb}</span>
        </button>
      ))}

      <h3>Pick your opponent</h3>
      <p>Sets the defensive coordinator's tendencies for this session.</p>
      <div className="coord-toggle">
        <button className="coord-arrow" onClick={() => cycle(-1)} aria-label="Previous coordinator">‹</button>
        <div className="coord-display">
          <div className="coord-name">{coordinator.name}</div>
          <div className="coord-blurb">{coordinator.blurb}</div>
          <div className="coord-count">{coordIndex + 1} / {COORDINATORS.length}</div>
        </div>
        <button className="coord-arrow" onClick={() => cycle(1)} aria-label="Next coordinator">›</button>
      </div>
    </div>
  );
}
