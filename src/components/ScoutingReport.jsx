export default function ScoutingReport({ coordinator, onBegin }) {
  return (
    <div className="scout-card">
      <h3>Scouting Report — {coordinator.name}</h3>
      <p>{coordinator.blurb}</p>
      {coordinator.disguises ? (
        <p><b>Disguise:</b> {coordinator.disguiseNote}</p>
      ) : (
        <p><b>No disguise.</b> What you see pre-snap is the truth.</p>
      )}
      <button className="btn-continue" onClick={onBegin}>Start Session</button>
    </div>
  );
}
