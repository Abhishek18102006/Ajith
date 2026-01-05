import { useState } from "react";

export default function SelectedTrainPanel({ train, onInjectDelay }) {
  const [delay, setDelay] = useState("");

  if (!train) {
    return (
      <div className="table-card">
        <h3>Train Details</h3>
        <p>Select a train to view details</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      {/* ✅ HEADING CHANGED */}
      <h3>Train Details</h3>

      <p><strong>ID:</strong> {train.train_id}</p>
      <p><strong>Name:</strong> {train.train_name}</p>
      <p><strong>Route:</strong> {train.source} → {train.destination}</p>
      <p><strong>Arrival:</strong> {train.arrival_time}</p>
      <p><strong>Priority:</strong> {train.priority}</p>

      <hr />

      <h4>Inject Delay (minutes)</h4>

      <input
        type="number"
        placeholder="Enter delay (min)"
        value={delay}
        onChange={e => setDelay(e.target.value)}
      />

      <button
        onClick={() => {
          if (!delay || delay <= 0) return;
          onInjectDelay(train.train_id, Number(delay));
          setDelay("");
        }}
      >
        Inject Delay
      </button>
    </div>
  );
}
