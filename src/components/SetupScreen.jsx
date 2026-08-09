import { TERM_PRESETS } from "../data/terminology";
import { OFFENSE_STYLES } from "../data/formations";

export default function SetupScreen({ termId, setTermId, onChooseStyle }) {
  return (
    <div className="scout-card">
      <h3>Terminology</h3>
      <p>Pick the language your staff actually uses. Only labels change — the reads stay the same.</p>
      <div className="term-row">
        {Object.entries(TERM_PRESETS).map(([id, t]) => (
          <button key={id} className={`btn ${termId === id ? "active" : ""}`} onClick={() => setTermId(id)}>
            {t.name}
            <span className="hint">{t.example}</span>
          </button>
        ))}
      </div>

      <h3>Pick your offensive identity</h3>
      <p>This sets your run/pass tendency and personnel groupings.</p>
      {OFFENSE_STYLES.map((s) => (
        <button key={s.id} className="btn btn-full" onClick={() => onChooseStyle(s)}>
          {s.name}
          <span className="hint">{s.blurb}</span>
        </button>
      ))}
    </div>
  );
}
