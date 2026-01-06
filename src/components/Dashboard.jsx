import { useState } from "react";
import TrainPrecedencePanel from "./TrainPrecedencePanel";
import TrainDetails from "./TrainDetails";
import Conflicts from "../components/Conflicts";

/* ============================
   DASHBOARD
   ============================ */
export default function Dashboard({ trains, setTrains }) {
  const [selectedTrain, setSelectedTrain] = useState(null);

  /* ============================
     DELAY INJECTION
     ============================ */
  function injectDelay(trainId, delay) {
    setTrains(prev =>
      prev.map(t =>
        t.train_id === trainId
          ? {
              ...t,
              delay,
              status: "IN_CONFLICT",
              conflict_reason: "Departure delay"
            }
          : t
      )
    );
  }

  /* ============================
     ACCEPT AI RESOLUTION
     ============================ */
  function handleAcceptResolution(trainId) {
    setTrains(prev =>
      prev.map(t =>
        t.train_id === trainId
          ? {
              ...t,
              delay: 0,
              status: "ON TIME",
              conflict_reason: null
            }
          : t
      )
    );
  }

  /* ============================
     REJECT AI RESOLUTION
     ============================ */
  function handleRejectResolution(trainId) {
    setTrains(prev =>
      prev.map(t =>
        t.train_id === trainId
          ? {
              ...t,
              status: "DELAYED"
            }
          : t
      )
    );
  }

  /* ============================
     CLEAR TRAIN (SECTION EXIT)
     ============================ */
  function handleClearTrain(trainId) {
    setTrains(prev =>
      prev.filter(t => t.train_id !== trainId)
    );

    if (selectedTrain?.train_id === trainId) {
      setSelectedTrain(null);
    }
  }

  /* ============================
     DERIVED DATA
     ============================ */
  const activeTrains = trains.filter(t => t.status !== "CLEARED");

  return (
    <>
      {/* ================= KPIs ================= */}
      <div className="card-grid">
        <StatusCard title="Active Trains" value={activeTrains.length} />
        <StatusCard
          title="Conflicts"
          value={activeTrains.filter(t => t.status === "IN_CONFLICT").length}
        />
        <StatusCard
          title="System Status"
          value={
            activeTrains.some(t => t.status === "IN_CONFLICT")
              ? "PAUSED"
              : "RUNNING"
          }
        />
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="dashboard-grid">
        {/* LEFT: TRAIN LIST */}
        <TrainPrecedencePanel
          trains={activeTrains}
          setTrains={setTrains}
          onSelect={setSelectedTrain}
        />

        {/* RIGHT: TRAIN DETAILS */}
        <TrainDetails
          train={selectedTrain}
          onDelayInject={injectDelay}
          onClear={handleClearTrain}
        />
      </div>

      {/* ================= CONFLICT RESOLUTION ================= */}
      <Conflicts
        trains={activeTrains}
        onAcceptResolution={handleAcceptResolution}
        onRejectResolution={handleRejectResolution}
      />
    </>
  );
}

/* ============================
   STATUS CARD
   ============================ */
function StatusCard({ title, value }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <p className="card-value">{value}</p>
    </div>
  );
}
