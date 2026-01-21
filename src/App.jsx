// src/App.jsx (COMPLETE - Fixed Conflict Tracking)
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import Conflicts from "./components/Conflicts";
import HistoryPage from "./pages/HistoryPage";
import PerformancePage from "./pages/PerformancePage";
import { timeToMinutes } from "./utils/time";

function App() {
  const [user, setUser] = useState(null);
  const [trains, setTrains] = useState([]);
  const [page, setPage] = useState("dashboard");
  
  const [history, setHistory] = useState([]);
  
  const [performanceData, setPerformanceData] = useState({
    totalConflictsDetected: 0,
    totalConflictsResolved: 0,
    totalConflictsRejected: 0,
    averageResolutionTime: 0,
    totalTrainsCleared: 0,
    aiAccuracyRate: 85,
    totalDelayReduced: 0,
    blockConflictsDetected: 0,
    blockConflictsResolved: 0,
    loopConflictsDetected: 0,
    loopConflictsResolved: 0,
    junctionConflictsDetected: 0,
    junctionConflictsResolved: 0,
    resolutionHistory: []
  });

  useEffect(() => {
    console.log("📊 Current State:", {
      trains: trains.length,
      history: history.length,
      page,
      performanceData
    });
  }, [trains, history, page, performanceData]);

  function handleClearTrain(trainId) {
    const train = trains.find(t => t.train_id === trainId);
    if (!train) {
      console.error(`❌ Train ${trainId} not found`);
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    console.log(`✅ Clearing train ${trainId} from junction at ${timeString}`);

    const historyRecord = {
      ...train,
      clearedAt: timeString,
      clearedDate: now.toLocaleDateString(),
      status: train.status === "RESOLVED" ? "RESOLVED" : "CLEARED"
    };

    setHistory(prev => {
      const updated = [historyRecord, ...prev];
      console.log(`📜 History updated. Total records: ${updated.length}`);
      return updated;
    });

    setTrains(prev => {
      const updated = prev.filter(t => t.train_id !== trainId);
      console.log(`🚂 Active trains updated. Remaining: ${updated.length}`);
      return updated;
    });

    setPerformanceData(prev => ({
      ...prev,
      totalTrainsCleared: prev.totalTrainsCleared + 1
    }));

    console.log(`✅ Train ${trainId} cleared successfully`);
  }

  function handleAcceptResolution(trainId, resolutionDetails = {}) {
    console.log(`✅ Accepting AI resolution for train ${trainId}`, resolutionDetails);
    
    const startTime = performance.now();
    
    setTrains(prev =>
      prev.map(t => {
        if (t.train_id === resolutionDetails.reduced_train) {
          // Calculate new arrival time based on delay
          const originalArrival = t.arrival || timeToMinutes(t.arrival_time);
          let newDelay = t.delay || 0;
          
          // Apply delay if junction conflict
          if (resolutionDetails.suggested_delay) {
            newDelay += resolutionDetails.suggested_delay;
          }
          
          // Apply delay reduction if applicable
          if (resolutionDetails.delayReduction) {
            newDelay = Math.max(0, newDelay - resolutionDetails.delayReduction);
          }
          
          const newArrival = originalArrival + newDelay;
          
          const updatedTrain = {
            ...t,
            status: "RESOLVED",
            conflict: false,
            conflict_reason: `Resolved: ${resolutionDetails.decision}`,
            max_speed: resolutionDetails.suggested_speed || t.max_speed,
            delay: newDelay,
            arrival: newArrival, // ⭐ UPDATE ARRIVAL TIME
            resolution_applied: resolutionDetails.decision,
            resolution_time: new Date().toLocaleTimeString(),
            resolved_at: Date.now() // ⭐ TIMESTAMP FOR TRACKING
          };
          
          console.log(`🔄 Updated train ${t.train_id}:`, {
            old_speed: t.max_speed,
            new_speed: updatedTrain.max_speed,
            old_delay: t.delay,
            new_delay: updatedTrain.delay,
            old_arrival: originalArrival,
            new_arrival: newArrival,
            old_status: t.status,
            new_status: updatedTrain.status,
            resolution: resolutionDetails.decision
          });
          
          return updatedTrain;
        }
        
        if (t.train_id === resolutionDetails.priority_train) {
          return {
            ...t,
            status: "ON TIME",
            conflict: false,
            conflict_reason: null,
            resolved_at: Date.now() // ⭐ MARK AS RESOLVED
          };
        }
        
        return t;
      })
    );

    const endTime = performance.now();
    const resolutionTime = ((endTime - startTime) / 1000).toFixed(3);

    setPerformanceData(prev => {
      const newResolutionCount = prev.totalConflictsResolved + 1;
      const newAverageTime = (
        (prev.averageResolutionTime * prev.totalConflictsResolved + parseFloat(resolutionTime)) / 
        newResolutionCount
      );

      const delayReduction = resolutionDetails.delayReduction || 0;
      
      const newResolution = {
        timestamp: new Date().toLocaleTimeString(),
        priority_train: resolutionDetails.priority_train || trainId,
        reduced_train: resolutionDetails.reduced_train || trainId,
        decision: resolutionDetails.decision || "RESOLVED",
        confidence: resolutionDetails.confidence || 75,
        resolutionTime: resolutionTime,
        conflictType: resolutionDetails.conflictType || "UNKNOWN"
      };

      const updated = {
        ...prev,
        totalConflictsResolved: newResolutionCount,
        averageResolutionTime: newAverageTime,
        totalDelayReduced: prev.totalDelayReduced + delayReduction,
        resolutionHistory: [newResolution, ...prev.resolutionHistory.slice(0, 49)]
      };
      
      console.log("📊 Performance updated:", updated);
      return updated;
    });
  }

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

    setPerformanceData(prev => ({
      ...prev,
      totalConflictsRejected: prev.totalConflictsRejected + 1
    }));
  }

  function updateConflictCounts(conflictType, detected, resolved = 0) {
    setPerformanceData(prev => {
      const updates = { ...prev };
      
      switch(conflictType) {
        case 'block':
          // Only update if detected is higher (for initial detection)
          if (detected !== undefined && detected > 0) {
            updates.blockConflictsDetected = Math.max(prev.blockConflictsDetected, detected);
          }
          // Always add to resolved count
          if (resolved > 0) {
            updates.blockConflictsResolved = prev.blockConflictsResolved + resolved;
          }
          break;
        case 'loop':
          if (detected !== undefined && detected > 0) {
            updates.loopConflictsDetected = Math.max(prev.loopConflictsDetected, detected);
          }
          if (resolved > 0) {
            updates.loopConflictsResolved = prev.loopConflictsResolved + resolved;
          }
          break;
        case 'junction':
          if (detected !== undefined && detected > 0) {
            updates.junctionConflictsDetected = Math.max(prev.junctionConflictsDetected, detected);
          }
          if (resolved > 0) {
            updates.junctionConflictsResolved = prev.junctionConflictsResolved + resolved;
          }
          break;
      }
      
      // Update total counts
      updates.totalConflictsDetected = 
        updates.blockConflictsDetected + 
        updates.loopConflictsDetected + 
        updates.junctionConflictsDetected;
      
      console.log("📊 Performance counts updated:", {
        type: conflictType,
        detected,
        resolved,
        newTotals: {
          blockDetected: updates.blockConflictsDetected,
          blockResolved: updates.blockConflictsResolved,
          loopDetected: updates.loopConflictsDetected,
          loopResolved: updates.loopConflictsResolved,
          junctionDetected: updates.junctionConflictsDetected,
          junctionResolved: updates.junctionConflictsResolved,
          totalDetected: updates.totalConflictsDetected
        }
      });
      
      return updates;
    });
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Layout setPage={setPage} currentPage={page}>
      {page === "dashboard" && (
        <Dashboard 
          trains={trains} 
          setTrains={setTrains}
          onClearTrain={handleClearTrain}
          onAcceptResolution={handleAcceptResolution}
          onRejectResolution={handleRejectResolution}
          performanceData={performanceData}
        />
      )}

      {page === "conflicts" && (
        <Conflicts
          trains={trains}
          onAcceptResolution={handleAcceptResolution}
          onRejectResolution={handleRejectResolution}
          onUpdateConflictCounts={updateConflictCounts}
        />
      )}

      {page === "history" && (
        <HistoryPage history={history} />
      )}

      {page === "performance" && (
        <PerformancePage 
          performanceData={performanceData}
          history={history}
          trains={trains}
        />
      )}
    </Layout>
  );
}

export default App;