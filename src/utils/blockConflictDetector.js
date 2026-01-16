import { effectiveArrival } from "./time";

/**
 * Enhanced Block Conflict Detector
 * Detects conflicts when trains approach same block from opposite directions
 */
export function detectBlockConflicts(trains) {
  const conflicts = [];

  if (!Array.isArray(trains) || trains.length === 0) {
    return conflicts;
  }

  for (let i = 0; i < trains.length; i++) {
    for (let j = i + 1; j < trains.length; j++) {
      const a = trains[i];
      const b = trains[j];

      if (!isValidTrain(a) || !isValidTrain(b)) {
        console.warn("Skipping invalid train in conflict detection", { a, b });
        continue;
      }

      // Check if trains are in the same block
      if (a.block_id !== b.block_id) continue;

      // Check if approaching from opposite directions
      if (a.approach_dir === b.approach_dir) continue;

      // ⭐ Calculate effective arrival times (uses 'arrival' field or calculates)
      const ta = a.arrival || effectiveArrival(a);
      const tb = b.arrival || effectiveArrival(b);
      const clearance = Number(a.clearance_min) || 3;

      const timeDiff = Math.abs(ta - tb);
      
      console.log(`🔍 Checking conflict between Train ${a.train_id} and ${b.train_id}:`, {
        block: a.block_id,
        trainA_scheduled: a.arrival_time,
        trainA_delay: a.delay,
        trainA_effective: ta,
        trainB_scheduled: b.arrival_time,
        trainB_delay: b.delay,
        trainB_effective: tb,
        timeDiff: timeDiff,
        clearance: clearance,
        isConflict: timeDiff <= clearance
      });
      
      if (timeDiff <= clearance) {
        const severity = getSeverity(timeDiff, clearance);
        
        conflicts.push({
          type: "SAME_BLOCK",
          block_id: a.block_id,
          trainA: a.train_id,
          trainB: b.train_id,
          timeDiff: Math.round(timeDiff),
          severity: severity,
          trainAObj: a,
          trainBObj: b,
          message: `Opposing trains ${a.train_id} and ${b.train_id} in block ${a.block_id}`
        });
      }
    }
  }

  return conflicts;
}

/**
 * Validate that a train object has all required fields
 */
function isValidTrain(train) {
  if (!train) return false;
  
  const requiredFields = [
    'train_id',
    'arrival_time',
    'block_id',
    'approach_dir'
  ];
  
  for (const field of requiredFields) {
    if (train[field] === undefined || train[field] === null) {
      console.error(`Train ${train.train_id || 'UNKNOWN'} missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate conflict severity based on time gap
 */
function getSeverity(timeDiff, clearance) {
  const ratio = timeDiff / clearance;
  
  if (ratio < 0.33) {
    return "CRITICAL";
  } else if (ratio < 0.67) {
    return "HIGH";
  } else {
    return "MEDIUM";
  }
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity) {
  const colors = {
    CRITICAL: "#dc2626",
    HIGH: "#ea580c",
    MEDIUM: "#d97706",
    LOW: "#16a34a"
  };
  return colors[severity] || "#64748b";
}

/**
 * Format conflict message for display
 */
export function formatConflictMessage(conflict) {
  const { trainA, trainB, block_id, timeDiff, severity } = conflict;
  
  return {
    title: `${severity} Priority Conflict`,
    description: `Trains ${trainA} ↔ ${trainB} in Block ${block_id}`,
    timeGap: `Time Gap: ${timeDiff} minutes`,
    severity: severity
  };
}