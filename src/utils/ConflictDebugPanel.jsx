import { timeToMinutes, effectiveArrival, minutesToTime } from "../utils/time";

/**
 * Debug Panel to visualize conflict detection
 */
export function ConflictDebugPanel({ trains }) {
  if (!trains || trains.length === 0) return null;

  // Group trains by block
  const byBlock = {};
  trains.forEach(train => {
    if (!byBlock[train.block_id]) {
      byBlock[train.block_id] = [];
    }
    byBlock[train.block_id].push(train);
  });

  return (
    <details style={{
      background: "#f3f4f6",
      padding: "12px",
      borderRadius: "8px",
      marginTop: "16px",
      fontSize: "13px"
    }}>
      <summary style={{ 
        cursor: "pointer", 
        fontWeight: "600",
        color: "#374151",
        marginBottom: "12px"
      }}>
        🔍 Debug: Block & Conflict Analysis
      </summary>

      <div style={{ marginTop: "12px" }}>
        {Object.entries(byBlock).map(([blockId, trainsInBlock]) => (
          <div 
            key={blockId}
            style={{
              background: "white",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "12px",
              border: "1px solid #e5e7eb"
            }}
          >
            <div style={{ 
              fontWeight: "600", 
              marginBottom: "8px",
              color: "#1f2937"
            }}>
              📍 {blockId} ({trainsInBlock.length} trains)
            </div>

            <table style={{ 
              width: "100%", 
              fontSize: "12px",
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "4px", textAlign: "left" }}>Train</th>
                  <th style={{ padding: "4px", textAlign: "left" }}>Direction</th>
                  <th style={{ padding: "4px", textAlign: "left" }}>Scheduled</th>
                  <th style={{ padding: "4px", textAlign: "left" }}>Delay</th>
                  <th style={{ padding: "4px", textAlign: "left" }}>Effective</th>
                  <th style={{ padding: "4px", textAlign: "left" }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                {trainsInBlock
                  .sort((a, b) => effectiveArrival(a) - effectiveArrival(b))
                  .map((train, idx, arr) => {
                    const effective = train.arrival || effectiveArrival(train);
                    const nextTrain = arr[idx + 1];
                    const gap = nextTrain 
                      ? (nextTrain.arrival || effectiveArrival(nextTrain)) - effective 
                      : null;
                    
                    const isConflict = gap !== null && gap <= 3;

                    return (
                      <tr 
                        key={train.train_id}
                        style={{ 
                          borderBottom: "1px solid #f3f4f6",
                          background: isConflict ? "#fee2e2" : "transparent"
                        }}
                      >
                        <td style={{ padding: "4px", fontWeight: "500" }}>
                          {train.train_id}
                        </td>
                        <td style={{ padding: "4px" }}>
                          <span style={{
                            background: train.approach_dir === "UP" ? "#dbeafe" : "#fef3c7",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "11px"
                          }}>
                            {train.approach_dir}
                          </span>
                        </td>
                        <td style={{ padding: "4px" }}>{train.arrival_time}</td>
                        <td style={{ 
                          padding: "4px",
                          color: train.delay > 0 ? "#dc2626" : train.delay < 0 ? "#2563eb" : "#16a34a",
                          fontWeight: train.delay !== 0 ? "600" : "normal"
                        }}>
                          {train.delay > 0 ? `+${train.delay}` : train.delay || 0} min
                        </td>
                        <td style={{ padding: "4px", fontWeight: "500" }}>
                          {minutesToTime(effective)}
                        </td>
                        <td style={{ 
                          padding: "4px",
                          color: isConflict ? "#dc2626" : "#6b7280",
                          fontWeight: isConflict ? "600" : "normal"
                        }}>
                          {gap !== null ? (
                            isConflict ? `⚠ ${Math.round(gap)} min` : `${Math.round(gap)} min`
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {trainsInBlock.length >= 2 && (
              <div style={{ 
                marginTop: "8px",
                padding: "8px",
                background: "#f9fafb",
                borderRadius: "4px",
                fontSize: "11px"
              }}>
                <strong>Conflict Rules:</strong>
                <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                  <li>
                    <strong>Same Block (Opposite Dir):</strong> Time gap ≤ 3 min
                  </li>
                  <li>
                    <strong>Loop Line (Same Dir):</strong> Time gap &lt; 5 min
                  </li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
