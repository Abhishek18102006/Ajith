// src/pages/Conflicts.jsx

import { useState } from "react";
import { detectBlockConflicts } from "../utils/blockConflictDetector";
import { detectLoopLineConflicts } from "../utils/loopLineDetector";
import { resolveConflictAI } from "../utils/aiResolver";

/**
 * Props expected from Dashboard:
 * - trains
 * - onAcceptResolution(trainId)
 * - onRejectResolution(trainId)
 */
export default function Conflicts({
  trains,
  onAcceptResolution,
  onRejectResolution
}) {
  const sameBlockConflicts = detectBlockConflicts(trains);
  const loopLineConflicts = detectLoopLineConflicts(trains);

  const [aiResult, setAiResult] = useState(null);
  const [activeConflict, setActiveConflict] = useState(null);

  /* ============================
     AI RESOLUTION (SAME BLOCK)
     ============================ */
  async function handleResolve(conflict) {
    const result = await resolveConflictAI(conflict);
    setAiResult(result);
    setActiveConflict(conflict);
  }

  function handleAccept() {
    if (!aiResult) return;

    // Mark reduced train as resolved
    onAcceptResolution(aiResult.reduced_train);

    setAiResult(null);
    setActiveConflict(null);
  }

  function handleReject() {
    if (!aiResult) return;

    onRejectResolution(aiResult.reduced_train);

    setAiResult(null);
    setActiveConflict(null);
  }

  return (
    <div className="table-card">
      <h3>Conflict Resolution</h3>

      {/* ================= SAME BLOCK ================= */}
      <h4 style={{ marginTop: 12 }}>⚠ Same Block Conflicts</h4>

      {sameBlockConflicts.length === 0 ? (
        <p>No same-block conflicts</p>
      ) : (
        sameBlockConflicts.map((c, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ color: "red" }}>
              Block {c.block_id}: {c.trainA} ↔ {c.trainB} (Δ {c.timeDiff} min)
            </div>

            <button onClick={() => handleResolve(c)}>
              Resolve using AI
            </button>
          </div>
        ))
      )}

      {/* ================= LOOP LINE ================= */}
      <h4 style={{ marginTop: 20 }}>🔁 Loop Line Conflicts</h4>

      {loopLineConflicts.length === 0 ? (
        <p>No loop-line conflicts</p>
      ) : (
        loopLineConflicts.map((c, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              background: "#eef6ff",
              padding: 10,
              borderRadius: 6
            }}
          >
            <div><b>Block:</b> {c.block_id}</div>
            <div><b>Leading Train:</b> {c.leadingTrain}</div>
            <div><b>Following Train:</b> {c.followingTrain}</div>
            <div><b>Gap:</b> {c.timeDiff} min</div>

            <div style={{ marginTop: 6, color: "#1e40af" }}>
              👉 Suggested Action: Route Train {c.followingTrain} to LOOP LINE
            </div>
          </div>
        ))
      )}

      {/* ================= AI RESULT ================= */}
      {aiResult && (
        <div className="conflict-card" style={{ marginTop: 20 }}>
          <h4>🤖 AI Recommendation</h4>

          <p><b>Priority Train:</b> {aiResult.priority_train}</p>
          <p><b>Reduce Speed of:</b> {aiResult.reduced_train}</p>
          <p><b>Suggested Speed:</b> {aiResult.suggested_speed} km/h</p>
          <p><b>Reason:</b> {aiResult.reason}</p>

          <div style={{ marginTop: 10 }}>
            <button
              style={{ marginRight: 8 }}
              onClick={handleAccept}
            >
              ✅ Accept
            </button>

            <button onClick={handleReject}>
              ❌ Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
