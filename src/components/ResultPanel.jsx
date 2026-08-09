export default function ResultPanel({ result, onNext }) {
  return (
    <>
      <div className={`result-panel ${result.tier}`}>
        <div className="tier">{result.tier.toUpperCase()}</div>
        <div className="text">{result.explain}</div>
        {result.driveNote && <div className="drivenote">{result.driveNote}</div>}
      </div>
      <button className="btn-continue" onClick={onNext}>Next Rep</button>
    </>
  );
}
