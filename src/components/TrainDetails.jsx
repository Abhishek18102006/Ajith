import { useState } from "react";

export default function TrainDetails({ train, onDelayInject, onClear }) {
  const [delay, setDelay] = useState("");

  if (!train) {
    return (
      <div className="train-details empty">
        <p>Select a train to view details</p>
      </div>
    );
  }

  function handleInject() {
    const delayMin = Number(delay);
    
    if (isNaN(delayMin)) {
      alert("Please enter a valid number (can be negative)");
      return;
    }

    console.log(`💉 Injecting delay: ${delayMin} minutes to train ${train.train_id}`);
    onDelayInject(train.train_id, delayMin);
    setDelay("");
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleInject();
    }
  }

  return (
    <div className="train-details">
      <h3>{train.train_name}</h3>

      <div style={{ marginTop: "12px", fontSize: "14px", lineHeight: "1.8" }}>
        <p><b>Train ID:</b> {train.train_id}</p>
        <p><b>Route:</b> {train.source} → {train.destination}</p>
        <p><b>Scheduled Arrival:</b> {train.arrival_time}</p>
        <p><b>Departure:</b> {train.departure_time || train.arrival_time}</p>
        <p><b>Block:</b> {train.block_id}</p>
        <p><b>Direction:</b> {train.approach_dir}</p>
        <p><b>Priority:</b> {train.priority}</p>
        <p><b>Max Speed:</b> {train.max_speed} km/h</p>
        <p>
          <b>Status:</b>{" "}
          <span style={{ 
            color: train.status === "ON TIME" ? "#16a34a" : "#dc2626",
            fontWeight: "600"
          }}>
            {train.status}
          </span>
        </p>
        <p>
          <b>Current Delay:</b>{" "}
          <span style={{ 
            color: train.delay > 0 ? "#dc2626" : train.delay < 0 ? "#2563eb" : "#16a34a",
            fontWeight: "600"
          }}>
            {train.delay > 0 ? `+${train.delay}` : train.delay || 0} min
          </span>
        </p>
      </div>

      <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
        <h4 style={{ marginBottom: "12px", fontSize: "15px" }}>Inject Delay</h4>
        
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            type="number"
            step="any"
            placeholder="Enter delay (min)"
            value={delay}
            onChange={e => setDelay(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />

          <button
            onClick={handleInject}
            style={{
              padding: "8px 16px",
              background: "#1d6fa5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Inject Delay
          </button>
        </div>

        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
          💡 Tip: Use negative values (e.g., -25) to move train earlier
        </div>

        <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => { setDelay("-25"); }}
            style={{
              padding: "6px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            -25 min
          </button>
          <button
            onClick={() => { setDelay("-50"); }}
            style={{
              padding: "6px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            -50 min
          </button>
          <button
            onClick={() => { setDelay("25"); }}
            style={{
              padding: "6px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            +25 min
          </button>
          <button
            onClick={() => { setDelay("50"); }}
            style={{
              padding: "6px 12px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            +50 min
          </button>
          <button
            onClick={() => { setDelay("0"); }}
            style={{
              padding: "6px 12px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#dc2626"
            }}
          >
            Reset (0)
          </button>
        </div>
      </div>

      {onClear && (
        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
          <button
            onClick={() => {
              if (window.confirm(`Clear train ${train.train_id} from section?`)) {
                onClear(train.train_id);
              }
            }}
            style={{
              width: "100%",
              padding: "10px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            🚂 Clear Train from Section
          </button>
        </div>
      )}
    </div>
  );
}