import { useState } from "react";

export default function ConflictResolutionPanel({
  delayedTrains,
  selectedTrain,
  onInjectDelay
}) {
  const [delayInput, setDelayInput] = useState("");

  const handleManualDelay = () => {
    if (!delayInput || isNaN(delayInput)) return;
    onInjectDelay(selectedTrain.train_id, Number(delayInput));
    setDelayInput("");
  };

  return (
    <div className="table-card">
      <h3>Conflict Resolution</h3>

      {/* =========================
          SELECTED TRAIN DETAILS
      ========================== */}
      {selectedTrain && (
        <div className="delay-box">
          <h4>Selected Train</h4>

          <p><strong>ID:</strong> {selectedTrain.train_id}</p>
          <p><strong>Name:</strong> {selectedTrain.train_name}</p>
          <p><strong>Route:</strong> {selectedTrain.source} → {selectedTrain.destination}</p>
          <p><strong>Arrival:</strong> {selectedTrain.arrival_time}</p>
          <p><strong>Priority:</strong> {selectedTrain.priority}</p>

          <hr />

          {/* =========================
              MANUAL DELAY INPUT
          ========================== */}
          <h4>Inject Delay (minutes)</h4>

          <input
            type="number"
            placeholder="Enter delay (min)"
            value={delayInput}
            onChange={e => setDelayInput(e.target.value)}
            style={{ width: "100%", marginBottom: "8px" }}
          />

          <button onClick={handleManualDelay}>
            Inject Delay
          </button>
        </div>
      )}

      <hr />

      {/* =========================
          DELAYED TRAINS
      ========================== */}
      <h4>Delayed Trains</h4>

      {delayedTrains.length === 0 ? (
        <p>No delayed trains</p>
      ) : (
        delayedTrains.map(t => (
          <div key={t.train_id} className="delayed-card">
            <strong>{t.train_id}</strong> — {t.train_name}
            <div>Delay: +{t.delay} min</div>
            <div>Arrival: {t.arrival_time}</div>
            <div>Priority: {t.priority}</div>
          </div>
        ))
      )}
    </div>
  );
}
