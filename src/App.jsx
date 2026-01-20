// src/App.jsx (WITHOUT NETWORK LINE VIEW)
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import Conflicts from "./components/Conflicts";
import HistoryPage from "./pages/HistoryPage";
import PerformancePage from "./pages/PerformancePage";

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
          const updatedTrain = {
            ...t,
            status: "RESOLVED",
            conflict: false,
            conflict_reason: "AI resolution applied",
            max_speed: resolutionDetails.suggested_speed || t.max_speed,
            delay: resolutionDetails.delayReduction 
              ? Math.max(0, (t.delay || 0) - resolutionDetails.delayReduction)
              : t.delay
          };
          
          console.log(`🔄 Updated train ${t.train_id}:`, {
            old_speed: t.max_speed,
            new_speed: updatedTrain.max_speed,
            old_delay: t.delay,
            new_delay: updatedTrain.delay,
            status: updatedTrain.status
          });
          
          return updatedTrain;
        }
        
        if (t.train_id === resolutionDetails.priority_train) {
          return {
            ...t,
            status: "ON TIME",
            conflict: false
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
        resolutionTime: resolutionTime
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
          updates.blockConflictsDetected = Math.max(prev.blockConflictsDetected, detected);
          updates.blockConflictsResolved += resolved;
          break;
        case 'loop':
          updates.loopConflictsDetected = Math.max(prev.loopConflictsDetected, detected);
          updates.loopConflictsResolved += resolved;
          break;
        case 'junction':
          updates.junctionConflictsDetected = Math.max(prev.junctionConflictsDetected, detected);
          updates.junctionConflictsResolved += resolved;
          break;
      }
      
      updates.totalConflictsDetected = 
        updates.blockConflictsDetected + 
        updates.loopConflictsDetected + 
        updates.junctionConflictsDetected;
      
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