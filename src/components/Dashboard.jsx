import { useState } from "react";
import TrainPrecedencePanel from "./TrainPrecedencePanel";
import TrainDetails from "./TrainDetails";
import Conflicts from "../components/Conflicts";
import { TrainDataValidator } from "../utils/trainDataValidator.jsx";
import { ConflictDebugPanel } from "../utils/ConflictDebugPanel";

/* ============================
   DASHBOARD
   ============================ */
export default function Dashboard({ trains, setTrains }) {
  const [selectedTrain, setSelectedTrain] = useState(null);

  /* ============================
     ⭐ CORRECTED DELAY INJECTION
     Preserves original schedule, applies delay
     ============================ */
  function injectDelay(trainId, delayMinutes) {
    const delayAmount = Number(delayMinutes);
    
    if (isNaN(delayAmount)) {
      console.error("Invalid delay amount:", delayMinutes);
      return;
    }
    
    console.log(`📥 Injecting delay: ${delayAmount} min to train ${trainId}`);
    
    setTrains(prev =>
      prev.map(t => {
        if (t.train_id !== trainId) return t;
        
        // ⭐ IMPORTANT: Use the ORIGINAL scheduled time, not current arrival_time
        // Store original time on first delay injection
        const originalScheduledTime = t.original_arrival_time || t.arrival_time;
        
        // Parse original scheduled time
        const [hours, minutes] = originalScheduledTime.split(":").map(Number);
        const scheduledMinutes = hours * 60 + minutes;
        
        // Calculate effective arrival = scheduled + delay
        let effectiveMinutes = scheduledMinutes + delayAmount;
        
        // Handle day wrap-around
        if (effectiveMinutes < 0) {
          effectiveMinutes = 1440 + effectiveMinutes;
        }
        effectiveMinutes = effectiveMinutes % 1440;
        
        const effectiveHour = Math.floor(effectiveMinutes / 60);
        const effectiveMinute = effectiveMinutes % 60;
        
        // ⭐ REASSIGN BLOCK BASED ON EFFECTIVE TIME
        let newBlockId;
        if (effectiveHour >= 5 && effectiveHour < 8) {
          newBlockId = "BLK_MORNING";
        } else if (effectiveHour >= 8 && effectiveHour < 10) {
          newBlockId = "BLK_RUSH";
        } else if (effectiveHour >= 10 && effectiveHour < 12) {
          newBlockId = "BLK_MIDDAY";
        } else {
          newBlockId = t.block_id;
        }
        
        console.log(`🔄 Train ${trainId} delay applied:`, {
          scheduledTime: originalScheduledTime,
          delayAmount: delayAmount,
          effectiveMinutes: effectiveMinutes,
          effectiveTime: `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`,
          oldBlock: t.block_id,
          newBlock: newBlockId
        });
        
        // ⭐ RETURN UPDATED TRAIN WITH PRESERVED SCHEDULE
        return {
          ...t,
          original_arrival_time: originalScheduledTime, // ⭐ Preserve original
          arrival_time: originalScheduledTime,          // ⭐ Keep showing scheduled time
          delay: delayAmount,                           // ⭐ Store delay
          arrival: effectiveMinutes,                    // ⭐ Effective time for conflict detection
          block_id: newBlockId,
          current_block: newBlockId,
          status: delayAmount !== 0 ? "DELAYED" : "ON TIME",
          conflict_reason: delayAmount !== 0 ? `${delayAmount > 0 ? '+' : ''}${delayAmount} min adjustment` : null
        };
      })
    );
  }

  /* ============================
     ⭐ ACCEPT AI RESOLUTION
     ============================ */
  function handleAcceptResolution(trainId) {
    console.log(`✅ Accepting AI resolution for train ${trainId}`);
    
    setTrains(prev =>
      prev.map(t =>
        t.train_id === trainId
          ? {
              ...t,
              status: "RESOLVED",
              conflict: false,
              conflict_reason: "AI resolution applied"
            }
          : t
      )
    );
  }

  /* ============================
     ⭐ REJECT AI RESOLUTION
     ============================ */
  function handleRejectResolution(trainId) {
    console.log(`❌ Rejecting AI resolution for train ${trainId}`);
    
    setTrains(prev =>
      prev.map(t =>
        t.train_id === trainId
          ? {
              ...t,
              status: "MANUAL_REVIEW",
              conflict: true,
              conflict_reason: "AI resolution rejected - requires manual intervention"
            }
          : t
      )
    );
  }

  /* ============================
     ⭐ CLEAR TRAIN (SECTION EXIT)
     ============================ */
  function handleClearTrain(trainId) {
    console.log(`🚂 Clearing train ${trainId} from section`);
    
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
  const conflictedTrains = activeTrains.filter(t => t.conflict || t.status === "IN_CONFLICT" || t.status === "DELAYED");

  return (
    <>
      {/* ================= DATA VALIDATOR ================= */}
      <TrainDataValidator trains={trains} />

      {/* ================= KPIs ================= */}
      <div className="card-grid">
        <StatusCard title="Active Trains" value={activeTrains.length} />
        <StatusCard
          title="Conflicts"
          value={conflictedTrains.length}
        />
        <StatusCard
          title="System Status"
          value={
            conflictedTrains.length > 0
              ? "CONFLICT"
              : "NORMAL"
          }
          color={conflictedTrains.length > 0 ? "#dc2626" : "#16a34a"}
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

      {/* ================= DEBUG PANEL ================= */}
      <ConflictDebugPanel trains={activeTrains} />
    </>
  );
}

/* ============================
   STATUS CARD
   ============================ */
function StatusCard({ title, value, color }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <p className="card-value" style={{ color: color || "#0a2540" }}>
        {value}
      </p>
    </div>
  );
}