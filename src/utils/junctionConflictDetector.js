// src/utils/junctionConflictDetector.js

import { timeToMinutes } from "./time";

/**
 * Detect Junction Conflicts
 * When multiple trains converge at a junction from different routes
 */
export function detectJunctionConflicts(trains) {
  const conflicts = [];

  // Validate input
  if (!Array.isArray(trains) || trains.length === 0) {
    return conflicts;
  }

  // Group trains by their next junction
  const byJunction = {};

  trains.forEach(train => {
    const junction = train.next_junction || train.next_block;
    
    if (!junction || junction === "null" || junction === "") return;

    if (!byJunction[junction]) {
      byJunction[junction] = [];
    }
    byJunction[junction].push(train);
  });

  // Check each junction for conflicts
  Object.entries(byJunction).forEach(([junctionId, trainsAtJunction]) => {
    if (trainsAtJunction.length < 2) return;

    // Sort by effective arrival time at junction
    const sorted = trainsAtJunction.sort((a, b) => {
      const timeA = calculateJunctionArrival(a);
      const timeB = calculateJunctionArrival(b);
      return timeA - timeB;
    });

    // Check each pair of consecutive trains
    for (let i = 0; i < sorted.length - 1; i++) {
      const train1 = sorted[i];
      const train2 = sorted[i + 1];

      const time1 = calculateJunctionArrival(train1);
      const time2 = calculateJunctionArrival(train2);
      const gap = time2 - time1;

      // Junction clearance time (default 5 minutes for safety)
      const clearanceTime = Number(train1.junction_clearance_min) || 5;

      if (gap <= clearanceTime) {
        const severity = getJunctionSeverity(gap, clearanceTime);
        
        conflicts.push({
          type: "JUNCTION",
          junction_id: junctionId,
          train1: train1.train_id,
          train2: train2.train_id,
          train1Obj: train1,
          train2Obj: train2,
          timeGap: Math.round(gap * 10) / 10,
          clearanceNeeded: clearanceTime,
          severity: severity,
          route1: train1.current_block || "Unknown",
          route2: train2.current_block || "Unknown",
          message: `Trains ${train1.train_id} and ${train2.train_id} converging at junction ${junctionId}`
        });
      }
    }
  });

  return conflicts;
}

/**
 * Calculate when train will arrive at junction
 * Based on current position, speed, and distance to junction
 */
function calculateJunctionArrival(train) {
  const baseArrival = timeToMinutes(train.arrival_time);
  const delay = Number(train.delay) || 0;
  
  // If distance to junction is specified, calculate travel time
  const distanceToJunction = Number(train.distance_to_junction) || 0;
  const currentSpeed = Number(train.max_speed) || 60;
  
  // Time to reach junction (distance/speed in hours, converted to minutes)
  const travelTime = distanceToJunction > 0 
    ? (distanceToJunction / currentSpeed) * 60 
    : 0;
  
  return baseArrival + delay + travelTime;
}

/**
 * Determine conflict severity based on time gap
 */
function getJunctionSeverity(gap, clearance) {
  const ratio = gap / clearance;
  
  if (ratio < 0.3) {
    return "CRITICAL";  // Less than 1.5 minutes for 5-min clearance
  } else if (ratio < 0.6) {
    return "HIGH";      // 1.5-3 minutes
  } else {
    return "MEDIUM";    // 3-5 minutes
  }
}

/**
 * Get severity color for UI
 */
export function getJunctionSeverityColor(severity) {
  const colors = {
    CRITICAL: "#dc2626",  // Red
    HIGH: "#ea580c",      // Orange-red
    MEDIUM: "#d97706",    // Orange
    LOW: "#16a34a"        // Green
  };
  return colors[severity] || "#64748b";
}

/**
 * Format junction conflict for display
 */
export function formatJunctionConflict(conflict) {
  return {
    title: `${conflict.severity} Junction Conflict`,
    description: `Junction ${conflict.junction_id}: Trains ${conflict.train1} & ${conflict.train2}`,
    timeGap: `Time Gap: ${conflict.timeGap} min (needs ${conflict.clearanceNeeded} min)`,
    routes: `Route 1: ${conflict.route1} | Route 2: ${conflict.route2}`,
    severity: conflict.severity
  };
}