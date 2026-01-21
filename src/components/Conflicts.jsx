// src/components/Conflicts.jsx (COMPLETE - Fixed All Issues)
import { useState, useEffect } from "react";
import { detectBlockConflicts, getSeverityColor } from "../utils/blockConflictDetector";
import { detectLoopLineConflicts } from "../utils/loopLineDetector";
import { detectJunctionConflicts, getJunctionSeverityColor } from "../utils/junctionConflictDetector";
import { resolveConflictAI } from "../utils/aiResolver";

export default function Conflicts({
  trains,
  onAcceptResolution,
  onRejectResolution,
  onUpdateConflictCounts
}) {
  // ⭐ SEPARATE AI RESULTS FOR EACH CONFLICT TYPE
  const [blockAiResults, setBlockAiResults] = useState({});
  const [loopAiResults, setLoopAiResults] = useState({});
  const [junctionAiResults, setJunctionAiResults] = useState({});
  
  const [error, setError] = useState(null);
  const [loadingConflictId, setLoadingConflictId] = useState(null);
  const [sameBlockConflicts, setSameBlockConflicts] = useState([]);
  const [loopLineConflicts, setLoopLineConflicts] = useState([]);
  const [junctionConflicts, setJunctionConflicts] = useState([]);
  const [recentlyResolved, setRecentlyResolved] = useState([]);

  // Detect conflicts
  useEffect(() => {
    try {
      if (Array.isArray(trains) && trains.length > 0) {
        const blockConflicts = detectBlockConflicts(trains);
        const loopConflicts = detectLoopLineConflicts(trains);
        const junctionConflictsData = detectJunctionConflicts(trains);
        
        setSameBlockConflicts(blockConflicts);
        setLoopLineConflicts(loopConflicts);
        setJunctionConflicts(junctionConflictsData);
        setError(null);

        if (onUpdateConflictCounts) {
          onUpdateConflictCounts('block', blockConflicts.length);
          onUpdateConflictCounts('loop', loopConflicts.length);
          onUpdateConflictCounts('junction', junctionConflictsData.length);
        }
      } else {
        setSameBlockConflicts([]);
        setLoopLineConflicts([]);
        setJunctionConflicts([]);
      }
    } catch (err) {
      console.error("Conflict detection error:", err);
      setError(err.message);
      setSameBlockConflicts([]);
      setLoopLineConflicts([]);
      setJunctionConflicts([]);
    }
  }, [trains, onUpdateConflictCounts]);

  // Track resolved conflicts for display
  useEffect(() => {
    const resolved = trains.filter(t => 
      t.status === "RESOLVED" && 
      t.resolved_at && 
      (Date.now() - t.resolved_at) < 300000 // Within last 5 minutes
    );
    setRecentlyResolved(resolved);
  }, [trains]);

  /* ⭐ AI RESOLUTION - WITH CONFLICT ID TRACKING */
  async function handleResolve(conflict, conflictType, conflictId) {
    setLoadingConflictId(conflictId);
    setError(null);
    
    try {
      console.log("🤖 Resolving conflict with AI:", conflict);
      
      const trainA = trains.find(t => 
        t.train_id === conflict.trainA || 
        t.train_id === conflict.leadingTrain || 
        t.train_id === conflict.train1
      );
      const trainB = trains.find(t => 
        t.train_id === conflict.trainB || 
        t.train_id === conflict.followingTrain || 
        t.train_id === conflict.train2
      );
      
      if (!trainA || !trainB) {
        throw new Error("Could not find train objects for conflict resolution");
      }

      const enrichedConflict = {
        ...conflict,
        trainAObj: trainA,
        trainBObj: trainB
      };
      
      const result = await resolveConflictAI(enrichedConflict);
      
      console.log("✅ AI Resolution received:", result);
      
      if (!result.success) {
        setError(result.error || "AI resolution failed");
        return;
      }
      
      // ⭐ STORE RESULT IN APPROPRIATE STATE BASED ON TYPE
      if (conflictType === "SAME_BLOCK") {
        setBlockAiResults(prev => ({ ...prev, [conflictId]: result }));
      } else if (conflictType === "LOOP_LINE") {
        setLoopAiResults(prev => ({ ...prev, [conflictId]: result }));
      } else if (conflictType === "JUNCTION") {
        setJunctionAiResults(prev => ({ ...prev, [conflictId]: result }));
      }
      
    } catch (err) {
      console.error("AI resolution error:", err);
      setError("Failed to resolve conflict: " + err.message);
    } finally {
      setLoadingConflictId(null);
    }
  }

  /* ⭐ ACCEPT RESOLUTION - WITH PROPER CONFLICT TRACKING */
  function handleAccept(conflictType, conflictId, aiResult) {
    if (!aiResult) {
      console.error("No AI result to accept");
      return;
    }

    console.log("✅ Accepting AI resolution:", aiResult);

    let delayReduction = 0;
    if (aiResult.suggested_speed > 0 && aiResult.suggested_speed < 80) {
      delayReduction = Math.floor((80 - aiResult.suggested_speed) / 10);
    }

    const resolutionDetails = {
      priority_train: aiResult.priority_train,
      reduced_train: aiResult.reduced_train,
      decision: aiResult.decision,
      confidence: aiResult.confidence,
      suggested_speed: aiResult.suggested_speed,
      suggested_delay: aiResult.suggested_delay,
      delayReduction: delayReduction,
      reason: aiResult.reason,
      conflictType: aiResult.conflictType
    };

    console.log("📤 Sending resolution details:", resolutionDetails);

    onAcceptResolution(aiResult.reduced_train, resolutionDetails);

    // ⭐ CLEAR AI RESULT FOR THIS SPECIFIC CONFLICT
    if (conflictType === "SAME_BLOCK") {
      setBlockAiResults(prev => {
        const updated = { ...prev };
        delete updated[conflictId];
        return updated;
      });
    } else if (conflictType === "LOOP_LINE") {
      setLoopAiResults(prev => {
        const updated = { ...prev };
        delete updated[conflictId];
        return updated;
      });
    } else if (conflictType === "JUNCTION") {
      setJunctionAiResults(prev => {
        const updated = { ...prev };
        delete updated[conflictId];
        return updated;
      });
    }

    // ⭐ UPDATE CONFLICT COUNTS IMMEDIATELY
    if (onUpdateConflictCounts) {
      const type = conflictType === 'SAME_BLOCK' ? 'block' :
                   conflictType === 'LOOP_LINE' ? 'loop' : 'junction';
      
      // Increment resolved count by 1
      onUpdateConflictCounts(type, 0, 1);
    }
    
    console.log("✅ Resolution accepted and state cleared");
  }

  /* ⭐ REJECT RESOLUTION - WITH CLEANUP */
  function handleReject(conflictType, conflictId, aiResult) {
    if (!aiResult) return;

    console.log("❌ Rejecting AI resolution for:", aiResult.reduced_train);
    onRejectResolution(aiResult.reduced_train);
    
    // ⭐ CLEAR AI RESULT FOR THIS SPECIFIC CONFLICT
    if (conflictType === "SAME_BLOCK") {
      setBlockAiResults(prev => {
        const updated = { ...prev };
        delete updated[conflictId];
        return updated;
      });
    } else if (conflictType === "LOOP_LINE") {
      setLoopAiResults(prev => {
        const updated = { ...prev };
        delete updated[conflictId];
        return updated;
      });
    } else if (conflictType === "JUNCTION") {
      setJunctionAiResults(prev => {
        const updated = { ...prev };
        delete updated[conflictId];
        return updated;
      });
    }
  }

  return (
    <div className="table-card">
      <h3>🚦 Conflict Resolution</h3>

      {/* ERROR DISPLAY */}
      {error && (
        <div style={{
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "16px",
          color: "#b91c1c"
        }}>
          ⚠ <strong>Error:</strong> {error}
        </div>
      )}

      {/* SAME BLOCK CONFLICTS */}
      <div style={{ marginTop: "20px" }}>
        <h4 style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          marginBottom: "12px" 
        }}>
          ⚠ Same Block Conflicts
          <span style={{
            background: sameBlockConflicts.length > 0 ? "#fca5a5" : "#d1fae5",
            color: sameBlockConflicts.length > 0 ? "#7f1d1d" : "#065f46",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600"
          }}>
            {sameBlockConflicts.length}
          </span>
        </h4>

        {sameBlockConflicts.length === 0 ? (
          <p style={{ color: "#16a34a", fontSize: "14px" }}>
            ✓ No same-block conflicts detected
          </p>
        ) : (
          sameBlockConflicts.map((conflict, i) => {
            const conflictId = `block_${i}`;
            const aiResult = blockAiResults[conflictId];
            const isLoading = loadingConflictId === conflictId;

            return (
              <div 
                key={i} 
                style={{
                  background: "#fef2f2",
                  border: `2px solid ${getSeverityColor(conflict.severity)}`,
                  padding: "14px",
                  borderRadius: "8px",
                  marginBottom: "12px"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "8px"
                }}>
                  <div>
                    <div style={{ 
                      fontSize: "12px", 
                      fontWeight: "600",
                      color: getSeverityColor(conflict.severity),
                      marginBottom: "4px"
                    }}>
                      Block: {conflict.block_id} | Severity: {conflict.severity}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      Train A: <strong>{conflict.trainA}</strong> ↔ 
                      Train B: <strong>{conflict.trainB}</strong>
                    </div>
                  </div>
                  <div style={{ 
                    background: getSeverityColor(conflict.severity),
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {conflict.timeDiff} min gap
                  </div>
                </div>

                {/* ⭐ RESOLVE BUTTON (Only show if no AI result) */}
                {!aiResult && (
                  <button 
                    onClick={() => handleResolve(conflict, "SAME_BLOCK", conflictId)}
                    disabled={isLoading}
                    style={{
                      background: isLoading ? "#9ca3af" : "#6366f1",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    {isLoading ? "🔄 Processing..." : "🤖 Resolve with AI"}
                  </button>
                )}

                {/* ⭐ AI RESULT (Inline with conflict) */}
                {aiResult && aiResult.success && (
                  <AIResultDisplay
                    aiResult={aiResult}
                    onAccept={() => handleAccept("SAME_BLOCK", conflictId, aiResult)}
                    onReject={() => handleReject("SAME_BLOCK", conflictId, aiResult)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* LOOP LINE CONFLICTS */}
      <div style={{ marginTop: "24px" }}>
        <h4 style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          marginBottom: "12px" 
        }}>
          🔁 Loop Line Conflicts
          <span style={{
            background: loopLineConflicts.length > 0 ? "#fed7aa" : "#d1fae5",
            color: loopLineConflicts.length > 0 ? "#7c2d12" : "#065f46",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600"
          }}>
            {loopLineConflicts.length}
          </span>
        </h4>

        {loopLineConflicts.length === 0 ? (
          <p style={{ color: "#16a34a", fontSize: "14px" }}>
            ✓ No loop-line conflicts detected
          </p>
        ) : (
          loopLineConflicts.map((conflict, i) => {
            const conflictId = `loop_${i}`;
            const aiResult = loopAiResults[conflictId];
            const isLoading = loadingConflictId === conflictId;

            return (
              <div
                key={i}
                style={{
                  background: "#eff6ff",
                  border: "2px solid #60a5fa",
                  padding: "14px",
                  borderRadius: "8px",
                  marginBottom: "12px"
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e40af" }}>
                    Block: {conflict.block_id}
                  </div>
                  <div style={{ fontSize: "14px", marginTop: "4px" }}>
                    <strong>Leading:</strong> Train {conflict.leadingTrain}
                    <br />
                    <strong>Following:</strong> Train {conflict.followingTrain}
                    <br />
                    <strong>Gap:</strong> {conflict.timeDiff} minutes
                  </div>
                </div>

                {!aiResult && (
                  <button 
                    onClick={() => handleResolve(conflict, "LOOP_LINE", conflictId)}
                    disabled={isLoading}
                    style={{
                      background: isLoading ? "#9ca3af" : "#6366f1",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    {isLoading ? "🔄 Processing..." : "🤖 Resolve with AI"}
                  </button>
                )}

                {aiResult && aiResult.success && (
                  <AIResultDisplay
                    aiResult={aiResult}
                    onAccept={() => handleAccept("LOOP_LINE", conflictId, aiResult)}
                    onReject={() => handleReject("LOOP_LINE", conflictId, aiResult)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* JUNCTION CONFLICTS */}
      <div style={{ marginTop: "24px" }}>
        <h4 style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          marginBottom: "12px" 
        }}>
          🔀 Junction Conflicts
          <span style={{
            background: junctionConflicts.length > 0 ? "#fca5a5" : "#d1fae5",
            color: junctionConflicts.length > 0 ? "#7f1d1d" : "#065f46",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600"
          }}>
            {junctionConflicts.length}
          </span>
        </h4>

        {junctionConflicts.length === 0 ? (
          <p style={{ color: "#16a34a", fontSize: "14px" }}>
            ✓ No junction conflicts detected
          </p>
        ) : (
          junctionConflicts.map((conflict, i) => {
            const conflictId = `junction_${i}`;
            const aiResult = junctionAiResults[conflictId];
            const isLoading = loadingConflictId === conflictId;

            return (
              <div 
                key={i} 
                style={{
                  background: "#fef3c7",
                  border: `2px solid ${getJunctionSeverityColor(conflict.severity)}`,
                  padding: "14px",
                  borderRadius: "8px",
                  marginBottom: "12px"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "8px"
                }}>
                  <div>
                    <div style={{ 
                      fontSize: "12px", 
                      fontWeight: "600",
                      color: getJunctionSeverityColor(conflict.severity),
                      marginBottom: "4px"
                    }}>
                      Junction: {conflict.junction_id} | Severity: {conflict.severity}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      Train 1: <strong>{conflict.train1}</strong> (from {conflict.route1})
                      <br />
                      Train 2: <strong>{conflict.train2}</strong> (from {conflict.route2})
                    </div>
                  </div>
                  <div style={{ 
                    background: getJunctionSeverityColor(conflict.severity),
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {conflict.timeGap} min gap
                    <div style={{ fontSize: "10px", opacity: 0.9 }}>
                      (needs {conflict.clearanceNeeded} min)
                    </div>
                  </div>
                </div>

                {!aiResult && (
                  <button 
                    onClick={() => handleResolve(conflict, "JUNCTION", conflictId)}
                    disabled={isLoading}
                    style={{
                      background: isLoading ? "#9ca3af" : "#6366f1",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    {isLoading ? "🔄 Processing..." : "🤖 Resolve with AI"}
                  </button>
                )}

                {aiResult && aiResult.success && (
                  <AIResultDisplay
                    aiResult={aiResult}
                    onAccept={() => handleAccept("JUNCTION", conflictId, aiResult)}
                    onReject={() => handleReject("JUNCTION", conflictId, aiResult)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* RECENTLY RESOLVED CONFLICTS */}
      {recentlyResolved.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h4 style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            marginBottom: "12px",
            color: "#16a34a"
          }}>
            ✅ Recently Resolved
            <span style={{
              background: "#d1fae5",
              color: "#065f46",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              {recentlyResolved.length}
            </span>
          </h4>

          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            padding: "12px",
            borderRadius: "8px"
          }}>
            {recentlyResolved.map((train, i) => (
              <div 
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px",
                  background: "white",
                  borderRadius: "6px",
                  marginBottom: i < recentlyResolved.length - 1 ? "8px" : "0",
                  border: "1px solid #bbf7d0"
                }}
              >
                <div>
                  <strong style={{ color: "#166534" }}>Train {train.train_id}</strong>
                  <span style={{ 
                    marginLeft: "8px", 
                    fontSize: "13px", 
                    color: "#16a34a" 
                  }}>
                    {train.resolution_applied}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#15803d" }}>
                  {train.resolution_time}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "#16a34a",
            fontStyle: "italic"
          }}>
            ℹ️ Trains will be available for re-evaluation after 5 minutes
          </div>
        </div>
      )}
    </div>
  );
}

/* ⭐ AI RESULT DISPLAY COMPONENT */
function AIResultDisplay({ aiResult, onAccept, onReject }) {
  return (
    <div 
      style={{
        marginTop: "12px",
        background: "#f0fdf4",
        border: "2px solid #4ade80",
        padding: "12px",
        borderRadius: "8px"
      }}
    >
      <h4 style={{ 
        marginBottom: "8px", 
        color: "#166534",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "6px"
      }}>
        🤖 AI Recommendation
        <span style={{
          background: "#dcfce7",
          color: "#166534",
          padding: "2px 6px",
          borderRadius: "8px",
          fontSize: "11px",
          fontWeight: "600"
        }}>
          {aiResult.confidence}% Confidence
        </span>
      </h4>

      <div style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "12px", color: "#166534" }}>
        <div style={{ marginBottom: "4px" }}>
          <strong>Decision:</strong> {aiResult.decision}
        </div>
        <div style={{ marginBottom: "4px" }}>
          <strong>Priority Train:</strong> {aiResult.priority_train}
        </div>
        <div style={{ marginBottom: "4px" }}>
          <strong>Affected Train:</strong> {aiResult.reduced_train}
        </div>
        {aiResult.suggested_speed && (
          <div style={{ marginBottom: "4px" }}>
            <strong>Suggested Speed:</strong> {aiResult.suggested_speed} km/h
          </div>
        )}
        {aiResult.suggested_delay && (
          <div style={{ marginBottom: "4px" }}>
            <strong>Suggested Delay:</strong> {aiResult.suggested_delay} minutes
          </div>
        )}
        <div style={{ marginTop: "8px", fontSize: "12px", fontStyle: "italic" }}>
          {aiResult.reason}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onAccept}
          style={{
            background: "#16a34a",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            flex: 1
          }}
        >
          ✅ Accept & Apply
        </button>

        <button
          onClick={onReject}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            flex: 1
          }}
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}