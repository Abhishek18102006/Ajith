// src/utils/aiResolver.js (UPDATED - Fixed Loop Line Conflict Handling)

export async function resolveConflictAI(conflict) {
  try {
    console.log("🔍 Conflict received:", conflict);
    
    // Extract conflict type
    const conflictType = conflict.type;
    console.log(`📊 Conflict Type: ${conflictType}`);
    
    // Route to appropriate resolver based on conflict type
    switch(conflictType) {
      case "SAME_BLOCK":
        return await resolveSameBlockConflict(conflict);
      
      case "LOOP_LINE":
        return await resolveLoopLineConflict(conflict);
      
      case "JUNCTION":
        return await resolveJunctionConflict(conflict);
      
      default:
        console.warn("⚠️ Unknown conflict type, using default resolver");
        return await resolveDefaultConflict(conflict);
    }

  } catch (err) {
    console.error("❌ AI RESOLUTION FAILED:", err);
    
    return {
      success: false,
      error: err.message,
      decision: "MANUAL_INTERVENTION",
      reason: `AI resolution failed: ${err.message}. Manual intervention required.`,
      confidence: 0
    };
  }
}

/* ================================================================
   SAME BLOCK CONFLICT RESOLVER
   Handles opposing trains on the same track
   ================================================================ */
async function resolveSameBlockConflict(conflict) {
  console.log("🚦 Resolving SAME BLOCK conflict");
  
  const trainA = conflict.trainAObj;
  const trainB = conflict.trainBObj;
  
  if (!trainA || !trainB) {
    throw new Error("Missing train objects for same block conflict");
  }

  // Build payload for ML model
  const payload = {
    priority_train: conflict.trainA,
    affected_train: conflict.trainB,
    priority_train_level: Number(trainA.priority) || 1,
    affected_train_level: Number(trainB.priority) || 1,
    priority_train_passengers: Number(trainA.passengers) || 600,
    priority_train_distance: Number(trainA.distance_km) || 300,
    priority_train_travel_time: Number(trainA.travel_time_hr) || 5.0,
    priority_train_capacity: Number(trainA.train_capacity) || 800,
    affected_train_passengers: Number(trainB.passengers) || 600,
    affected_train_distance: Number(trainB.distance_km) || 300,
    affected_train_travel_time: Number(trainB.travel_time_hr) || 5.0,
    affected_train_capacity: Number(trainB.train_capacity) || 800,
    passengers: Number(trainA.passengers || trainB.passengers || 600),
    distance_km: Number(trainA.distance_km || trainB.distance_km || 300),
    travel_time_hr: Number(trainA.travel_time_hr || trainB.travel_time_hr || 5.0),
    train_capacity: Number(trainA.train_capacity || trainB.train_capacity || 800),
    is_peak_hour: Number(trainA.is_peak_hour || trainB.is_peak_hour || 0),
    delay: Number(trainA.delay || trainB.delay || 0)
  };

  console.log("📤 Sending to ML API:", payload);

  const res = await fetch("http://localhost:5000/ai-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log("🤖 ML Response:", data);

  if (!data.success) {
    throw new Error(data.error || "ML returned unsuccessful response");
  }

  return {
    success: true,
    conflictType: "SAME_BLOCK",
    priority_train: data.priority_train,
    reduced_train: data.reduced_train,
    suggested_speed: data.suggested_speed || 0,
    reason: data.reason || "Opposing trains on same block - one must be held",
    confidence: data.confidence || 75,
    decision: data.decision || "HOLD_TRAIN",
    probabilities: data.probabilities,
    priority_analysis: data.priority_analysis,
    actionRequired: "HOLD",
    detailedAction: `Stop Train ${data.reduced_train} completely until Train ${data.priority_train} clears the block`
  };
}

/* ================================================================
   LOOP LINE CONFLICT RESOLVER
   Handles trains on same direction too close together
   ================================================================ */
async function resolveLoopLineConflict(conflict) {
  console.log("🔁 Resolving LOOP LINE conflict");
  
  // ⭐ Extract train objects - check all possible field names
  const leadingTrain = conflict.leadingTrainObj || conflict.trainAObj;
  const followingTrain = conflict.followingTrainObj || conflict.trainBObj;
  
  console.log("🔍 Loop conflict data:", {
    conflict_type: conflict.type,
    leading_train_id: conflict.leadingTrain,
    following_train_id: conflict.followingTrain,
    has_leading_obj: !!leadingTrain,
    has_following_obj: !!followingTrain,
    leading_obj_keys: leadingTrain ? Object.keys(leadingTrain) : [],
    following_obj_keys: followingTrain ? Object.keys(followingTrain) : []
  });
  
  if (!leadingTrain || !followingTrain) {
    console.error("❌ Missing train objects:", {
      leadingTrain: leadingTrain ? leadingTrain.train_id : "MISSING",
      followingTrain: followingTrain ? followingTrain.train_id : "MISSING",
      conflict_keys: Object.keys(conflict),
      conflict: conflict
    });
    throw new Error("Missing train objects for loop line conflict");
  }

  // Determine priority
  const leadingPriority = Number(leadingTrain.priority) || 2;
  const followingPriority = Number(followingTrain.priority) || 2;
  
  console.log("📊 Priority comparison:", {
    leading: { id: leadingTrain.train_id, priority: leadingPriority },
    following: { id: followingTrain.train_id, priority: followingPriority }
  });
  
  let priorityTrain, affectedTrain, decision, suggestedSpeed, reason;

  if (leadingPriority > followingPriority) {
    // Leading train has higher priority - reroute following train
    priorityTrain = conflict.leadingTrain;
    affectedTrain = conflict.followingTrain;
    decision = "ROUTE_TO_LOOP";
    suggestedSpeed = 60;
    reason = `Train ${priorityTrain} (Priority ${leadingPriority}) has precedence. Route Train ${affectedTrain} to LOOP LINE at reduced speed to maintain safe separation.`;
  } else if (followingPriority > leadingPriority) {
    // Following train has higher priority - speed up leading, slow following
    priorityTrain = conflict.followingTrain;
    affectedTrain = conflict.leadingTrain;
    decision = "SPEED_ADJUSTMENT";
    suggestedSpeed = Math.floor(Number(leadingTrain.max_speed) * 0.7);
    reason = `Train ${priorityTrain} (Priority ${followingPriority}) needs to overtake. Reduce Train ${affectedTrain} speed to ${suggestedSpeed} km/h and route to LOOP LINE.`;
  } else {
    // Same priority - use FIFO (first in, first out)
    priorityTrain = conflict.leadingTrain;
    affectedTrain = conflict.followingTrain;
    decision = "ROUTE_TO_LOOP";
    suggestedSpeed = 60;
    reason = `Equal priority - maintain current order. Route Train ${affectedTrain} to LOOP LINE at 60 km/h for safe following distance.`;
  }

  // Calculate confidence based on time gap
  const timeGap = conflict.timeDiff || 0;
  const confidence = timeGap < 2 ? 85 : timeGap < 4 ? 75 : 65;

  return {
    success: true,
    conflictType: "LOOP_LINE",
    priority_train: priorityTrain,
    reduced_train: affectedTrain,
    suggested_speed: suggestedSpeed,
    reason: reason,
    confidence: confidence,
    decision: decision,
    actionRequired: "REROUTE",
    detailedAction: `Divert Train ${affectedTrain} to LOOP LINE and maintain ${suggestedSpeed} km/h speed`,
    timeGap: timeGap,
    recommendedGap: 5
  };
}

/* ================================================================
   JUNCTION CONFLICT RESOLVER
   Handles multiple trains converging at junction
   ================================================================ */
async function resolveJunctionConflict(conflict) {
  console.log("🔀 Resolving JUNCTION conflict");
  
  const train1 = conflict.train1Obj;
  const train2 = conflict.train2Obj;
  
  if (!train1 || !train2) {
    throw new Error("Missing train objects for junction conflict");
  }

  // Get junction details
  const junctionId = conflict.junction_id;
  const clearanceNeeded = conflict.clearanceNeeded || 5;
  const timeGap = conflict.timeGap || 0;
  const severity = conflict.severity || "MEDIUM";

  // Determine priority based on multiple factors
  const priority1 = Number(train1.priority) || 2;
  const priority2 = Number(train2.priority) || 2;
  
  const passengers1 = Number(train1.passengers) || 0;
  const passengers2 = Number(train2.passengers) || 0;
  
  // Calculate priority score
  const score1 = (priority1 * 100) + (passengers1 * 0.1);
  const score2 = (priority2 * 100) + (passengers2 * 0.1);

  let priorityTrain, delayedTrain, entryDelay, reason;

  if (score1 > score2) {
    priorityTrain = conflict.train1;
    delayedTrain = conflict.train2;
    entryDelay = Math.max(clearanceNeeded - timeGap, 0);
    reason = `Train ${priorityTrain} (Priority ${priority1}, ${passengers1} passengers) gets junction entry first. Train ${delayedTrain} must wait ${Math.ceil(entryDelay)} minutes for junction clearance.`;
  } else if (score2 > score1) {
    priorityTrain = conflict.train2;
    delayedTrain = conflict.train1;
    entryDelay = Math.max(clearanceNeeded - timeGap, 0);
    reason = `Train ${priorityTrain} (Priority ${priority2}, ${passengers2} passengers) gets junction entry first. Train ${delayedTrain} must wait ${Math.ceil(entryDelay)} minutes for junction clearance.`;
  } else {
    // Equal scores - use arrival time (first come, first served)
    const arrivalTime1 = conflict.train1Obj.arrival || 0;
    const arrivalTime2 = conflict.train2Obj.arrival || 0;
    
    if (arrivalTime1 < arrivalTime2) {
      priorityTrain = conflict.train1;
      delayedTrain = conflict.train2;
    } else {
      priorityTrain = conflict.train2;
      delayedTrain = conflict.train1;
    }
    entryDelay = Math.max(clearanceNeeded - timeGap, 0);
    reason = `Equal priority - first arrival gets preference. Train ${delayedTrain} must wait ${Math.ceil(entryDelay)} minutes for junction clearance.`;
  }

  // Calculate confidence based on severity
  const confidence = severity === "CRITICAL" ? 95 : 
                    severity === "HIGH" ? 85 : 
                    severity === "MEDIUM" ? 75 : 65;

  return {
    success: true,
    conflictType: "JUNCTION",
    priority_train: priorityTrain,
    reduced_train: delayedTrain,
    suggested_speed: Number(train2.max_speed) || 100,
    suggested_delay: Math.ceil(entryDelay),
    reason: reason,
    confidence: confidence,
    decision: "SEQUENCE_AT_JUNCTION",
    actionRequired: "TIMED_ENTRY",
    detailedAction: `Train ${priorityTrain} enters ${junctionId} first. Train ${delayedTrain} holds at approach signal for ${Math.ceil(entryDelay)} minutes clearance.`,
    junctionId: junctionId,
    clearanceRequired: clearanceNeeded,
    currentGap: timeGap,
    severity: severity,
    entrySequence: [
      { train: priorityTrain, action: "PROCEED", note: "Clear to enter junction" },
      { train: delayedTrain, action: "HOLD", delay: Math.ceil(entryDelay), note: `Wait ${Math.ceil(entryDelay)} min for clearance` }
    ]
  };
}

/* ================================================================
   DEFAULT CONFLICT RESOLVER (Fallback)
   ================================================================ */
async function resolveDefaultConflict(conflict) {
  console.log("⚙️ Using default conflict resolver");
  
  // Extract train IDs from different conflict structures
  let trainA, trainB, trainAObj, trainBObj;
  
  if (conflict.trainA && conflict.trainB) {
    trainA = conflict.trainA;
    trainB = conflict.trainB;
    trainAObj = conflict.trainAObj;
    trainBObj = conflict.trainBObj;
  } else if (conflict.leadingTrain && conflict.followingTrain) {
    trainA = conflict.leadingTrain;
    trainB = conflict.followingTrain;
    trainAObj = conflict.leadingTrainObj;
    trainBObj = conflict.followingTrainObj;
  } else if (conflict.train1 && conflict.train2) {
    trainA = conflict.train1;
    trainB = conflict.train2;
    trainAObj = conflict.train1Obj;
    trainBObj = conflict.train2Obj;
  } else {
    throw new Error("Unknown conflict structure");
  }

  if (!trainAObj || !trainBObj) {
    throw new Error("Missing train data objects");
  }

  // Simple priority-based resolution
  const priorityA = Number(trainAObj.priority) || 2;
  const priorityB = Number(trainBObj.priority) || 2;

  if (priorityA > priorityB) {
    return {
      success: true,
      conflictType: "UNKNOWN",
      priority_train: trainA,
      reduced_train: trainB,
      suggested_speed: 60,
      decision: "REDUCE_SPEED",
      reason: `Train ${trainA} has higher priority (${priorityA} vs ${priorityB})`,
      confidence: 70
    };
  } else {
    return {
      success: true,
      conflictType: "UNKNOWN",
      priority_train: trainB,
      reduced_train: trainA,
      suggested_speed: 60,
      decision: "REDUCE_SPEED",
      reason: `Train ${trainB} has higher priority (${priorityB} vs ${priorityA})`,
      confidence: 70
    };
  }
}