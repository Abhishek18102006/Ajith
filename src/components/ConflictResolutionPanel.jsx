export default function ConflictResolutionPanel({ trains, onResolve }) {
  const delayedTrains = trains.filter(t => t.status === "DELAYED");

  return (
    <div className="conflict-panel">
      <h3>Conflict Resolution</h3>

      {delayedTrains.length === 0 ? (
        <p>No delayed trains</p>
      ) : (
        delayedTrains.map(t => (
          <div key={t.train_id} className="conflict-card">
            <strong>{t.train_id}</strong> {t.train_name}
            <div>Delay: {t.delay} min</div>

            <button onClick={() => onResolve(t.train_id)}>
              Resolve
            </button>
          </div>
        ))
      )}
    </div>
  );
}
