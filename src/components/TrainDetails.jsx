import { useState } from "react";

export default function TrainDetails({
  train,
  onDelayInject,
  onClear
}) {
  const [delay, setDelay] = useState("");

  if (!train) {
    return (
      <div className="train-details empty">
        Select a train to view details
      </div>
    );
  }

  return (
    <div className="train-details">
      <h3>Train Details</h3>

      <p><b>ID:</b> {train.train_id}</p>
      <p><b>Name:</b> {train.train_name}</p>
      <p><b>Arrival:</b> {train.arrival_time}</p>
      <p>
        <b>Status:</b>{" "}
        <span
          style={{
            color:
              train.status === "IN_CONFLICT"
                ? "#dc2626"
                : train.status === "ON TIME"
                ? "#16a34a"
                : "#374151"
          }}
        >
          {train.status}
        </span>
      </p>
      <p><b>Delay:</b> {train.delay} min</p>

      {/* ================= DELAY INJECTION ================= */}
      <div style={{ marginTop: 12 }}>
        <input
          type="number"
          placeholder="Inject delay (min)"
          value={delay}
          min="0"
          onChange={e => setDelay(e.target.value)}
          style={{ marginRight: 8 }}
        />

        <button
          onClick={() => {
            onDelayInject(train.train_id, Number(delay));
            setDelay("");
          }}
          disabled={delay === "" || Number(delay) <= 0}
        >
          ⏱ Inject Delay
        </button>
      </div>

      {/* ================= CLEAR TRAIN ================= */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => onClear(train.train_id)}
          style={{
            background: "#1f2937",
            color: "white",
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer"
          }}
        >
          🚦 Clear Train (Exit Section)
        </button>
      </div>
    </div>
  );
}
