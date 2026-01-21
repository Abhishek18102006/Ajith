// src/pages/ConflictResolution.jsx (NEW - Analytics & Status Panel)
import { useState, useEffect } from "react";
import Conflicts from "../components/Conflicts";

export default function ConflictResolution({ 
  trains, 
  onAcceptResolution, 
  onRejectResolution,
  onUpdateConflictCounts,
  performanceData 
}) {
  const [systemHealth, setSystemHealth] = useState("OPTIMAL");
  const [recentDecisions, setRecentDecisions] = useState([]);

  // Calculate system health based on active conflicts
  useEffect(() => {
    const conflictedTrains = trains.filter(t => 
      t.conflict || t.status === "IN_CONFLICT" || t.status === "DELAYED"
    );

    if (conflictedTrains.length === 0) {
      setSystemHealth("OPTIMAL");
    } else if (conflictedTrains.length <= 2) {
      setSystemHealth("MANAGING");
    } else if (conflictedTrains.length <= 5) {
      setSystemHealth("ALERT");
    } else {
      setSystemHealth("CRITICAL");
    }
  }, [trains]);

  // Track recent decisions
  useEffect(() => {
    if (performanceData.resolutionHistory && performanceData.resolutionHistory.length > 0) {
      setRecentDecisions(performanceData.resolutionHistory.slice(0, 5));
    }
  }, [performanceData.resolutionHistory]);

  const conflictedTrains = trains.filter(t => 
    t.conflict || t.status === "IN_CONFLICT" || t.status === "DELAYED"
  );
  const resolvedTrains = trains.filter(t => t.status === "RESOLVED");
  const activeTrains = trains.filter(t => t.status === "ON TIME");

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, color: "#0a2540" }}>
          🚦 Conflict Resolution Center
        </h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
          AI-powered conflict detection and resolution system
        </p>
      </div>

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 350px",
        gap: "20px"
      }}>
        {/* Left: Conflict Resolution Panel */}
        <div>
          <Conflicts
            trains={trains}
            onAcceptResolution={onAcceptResolution}
            onRejectResolution={onRejectResolution}
            onUpdateConflictCounts={onUpdateConflictCounts}
          />
        </div>

        {/* Right: Analytics & Status Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* System Health Card */}
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              marginBottom: "16px", 
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              💓 System Health
            </h3>
            
            <div style={{
              background: getHealthColor(systemHealth).bg,
              border: `2px solid ${getHealthColor(systemHealth).border}`,
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "32px",
                fontWeight: "700",
                color: getHealthColor(systemHealth).text,
                marginBottom: "4px"
              }}>
                {systemHealth}
              </div>
              <div style={{
                fontSize: "13px",
                color: getHealthColor(systemHealth).text,
                opacity: 0.8
              }}>
                {getHealthMessage(systemHealth, conflictedTrains.length)}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px"
            }}>
              <StatBadge
                label="Active"
                value={activeTrains.length}
                color="#16a34a"
              />
              <StatBadge
                label="Conflicts"
                value={conflictedTrains.length}
                color="#dc2626"
              />
              <StatBadge
                label="Resolved"
                value={resolvedTrains.length}
                color="#0284c7"
              />
            </div>
          </div>

          {/* AI Performance Card */}
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              marginBottom: "16px", 
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              🤖 AI Performance
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <MetricRow
                label="Total Resolved"
                value={performanceData.totalConflictsResolved || 0}
                color="#16a34a"
              />
              <MetricRow
                label="Avg Response Time"
                value={`${(performanceData.averageResolutionTime || 0).toFixed(2)}s`}
                color="#0284c7"
              />
              <MetricRow
                label="Success Rate"
                value={`${performanceData.totalConflictsDetected > 0 
                  ? Math.round((performanceData.totalConflictsResolved / performanceData.totalConflictsDetected) * 100)
                  : 0}%`}
                color="#7c3aed"
              />
              <MetricRow
                label="Delay Saved"
                value={`${performanceData.totalDelayReduced || 0} min`}
                color="#d97706"
              />
            </div>
          </div>

          {/* Recent Decisions Card */}
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              marginBottom: "16px", 
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              🕐 Recent AI Decisions
            </h3>

            {recentDecisions.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: "#64748b",
                fontSize: "14px"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                No decisions yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recentDecisions.map((decision, i) => (
                  <DecisionCard key={i} decision={decision} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ 
              marginBottom: "16px", 
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ⚡ Quick Actions
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <QuickActionButton
                icon="🔄"
                label="Refresh System"
                onClick={() => window.location.reload()}
              />
              <QuickActionButton
                icon="📊"
                label="View Analytics"
                onClick={() => window.location.hash = "#performance"}
              />
              <QuickActionButton
                icon="📜"
                label="View History"
                onClick={() => window.location.hash = "#history"}
              />
            </div>
          </div>

          {/* System Recommendations */}
          {conflictedTrains.length > 3 && (
            <div style={{
              background: "#fef3c7",
              border: "2px solid #fbbf24",
              padding: "16px",
              borderRadius: "10px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "start",
                gap: "10px",
                marginBottom: "8px"
              }}>
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <strong style={{ color: "#92400e", fontSize: "14px" }}>
                    High Conflict Alert
                  </strong>
                  <p style={{ 
                    margin: "4px 0 0 0", 
                    fontSize: "13px", 
                    color: "#78350f",
                    lineHeight: "1.5"
                  }}>
                    {conflictedTrains.length} active conflicts detected. 
                    Consider using AI recommendations to resolve conflicts quickly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: "#f8fafc",
      padding: "8px",
      borderRadius: "6px",
      textAlign: "center",
      border: `1px solid ${color}20`
    }}>
      <div style={{
        fontSize: "18px",
        fontWeight: "700",
        color: color
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "11px",
        color: "#64748b",
        marginTop: "2px"
      }}>
        {label}
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #f3f4f6"
    }}>
      <span style={{ fontSize: "13px", color: "#64748b" }}>
        {label}
      </span>
      <strong style={{ fontSize: "15px", color: color }}>
        {value}
      </strong>
    </div>
  );
}

function DecisionCard({ decision }) {
  return (
    <div style={{
      background: "#f8fafc",
      padding: "10px",
      borderRadius: "6px",
      borderLeft: `3px solid ${getDecisionColor(decision.decision)}`
    }}>
      <div style={{
        fontSize: "12px",
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: "4px"
      }}>
        {decision.priority_train} vs {decision.reduced_train}
      </div>
      <div style={{
        fontSize: "11px",
        color: "#64748b",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <span>{decision.decision}</span>
        <span>{decision.timestamp}</span>
      </div>
      <div style={{
        fontSize: "10px",
        color: "#0284c7",
        marginTop: "4px"
      }}>
        {decision.confidence}% confidence • {decision.resolutionTime}s
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 12px",
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        color: "#334155",
        transition: "all 0.2s",
        width: "100%"
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "#e5e7eb";
        e.target.style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "#f8fafc";
        e.target.style.transform = "translateX(0)";
      }}
    >
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Helper Functions

function getHealthColor(health) {
  const colors = {
    OPTIMAL: {
      bg: "#dcfce7",
      border: "#16a34a",
      text: "#166534"
    },
    MANAGING: {
      bg: "#dbeafe",
      border: "#0284c7",
      text: "#1e40af"
    },
    ALERT: {
      bg: "#fef3c7",
      border: "#d97706",
      text: "#92400e"
    },
    CRITICAL: {
      bg: "#fee2e2",
      border: "#dc2626",
      text: "#991b1b"
    }
  };
  return colors[health] || colors.OPTIMAL;
}

function getHealthMessage(health, conflictCount) {
  const messages = {
    OPTIMAL: "All systems running smoothly",
    MANAGING: `${conflictCount} conflict(s) being managed`,
    ALERT: `${conflictCount} conflicts require attention`,
    CRITICAL: `${conflictCount} critical conflicts detected`
  };
  return messages[health] || "System status unknown";
}

function getDecisionColor(decision) {
  const colors = {
    HOLD_TRAIN: "#dc2626",
    ROUTE_TO_LOOP: "#d97706",
    REDUCE_SPEED: "#0284c7",
    SEQUENCE_AT_JUNCTION: "#7c3aed",
    SPEED_ADJUSTMENT: "#16a34a"
  };
  return colors[decision] || "#6366f1";
}