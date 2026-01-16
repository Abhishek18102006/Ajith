// src/utils/aiResolver.js

export async function resolveConflictAI(conflict) {
  try {
    console.log("🔍 Conflict received:", conflict);
    
    // Extract train IDs from different conflict types
    let trainA, trainB, trainAObj, trainBObj;
    
    // Handle different conflict structures
    if (conflict.trainA && conflict.trainB) {
      // Same block conflicts
      trainA = conflict.trainA;
      trainB = conflict.trainB;
      trainAObj = conflict.trainAObj;
      trainBObj = conflict.trainBObj;
    } else if (conflict.leadingTrain && conflict.followingTrain) {
      // Loop line conflicts
      trainA = conflict.leadingTrain;
      trainB = conflict.followingTrain;
      trainAObj = conflict.leadingTrainObj;
      trainBObj = conflict.followingTrainObj;
    } else if (conflict.train1 && conflict.train2) {
      // Junction conflicts
      trainA = conflict.train1;
      trainB = conflict.train2;
      trainAObj = conflict.train1Obj;
      trainBObj = conflict.train2Obj;
    } else {
      console.error("❌ Unknown conflict structure:", conflict);
      throw new Error("Unknown conflict structure - missing train identifiers");
    }

    // Validate we have train objects
    if (!trainAObj || !trainBObj) {
      console.error("❌ Missing train objects:", { trainAObj, trainBObj });
      throw new Error("Missing train data objects");
    }

    // Build payload with all required fields + detailed train data for priority comparison
    const payload = {
      priority_train: trainA,
      affected_train: trainB,
      
      // Priority levels
      priority_train_level: Number(trainAObj.priority) || 1,
      affected_train_level: Number(trainBObj.priority) || 1,
      
      // Priority train detailed data
      priority_train_passengers: Number(trainAObj.passengers) || 600,
      priority_train_distance: Number(trainAObj.distance_km) || 300,
      priority_train_travel_time: Number(trainAObj.travel_time_hr) || 5.0,
      priority_train_capacity: Number(trainAObj.train_capacity) || 800,
      
      // Affected train detailed data
      affected_train_passengers: Number(trainBObj.passengers) || 600,
      affected_train_distance: Number(trainBObj.distance_km) || 300,
      affected_train_travel_time: Number(trainBObj.travel_time_hr) || 5.0,
      affected_train_capacity: Number(trainBObj.train_capacity) || 800,
      
      // Default fields (for backwards compatibility)
      passengers: Number(trainAObj.passengers || trainBObj.passengers || 600),
      distance_km: Number(trainAObj.distance_km || trainBObj.distance_km || 300),
      travel_time_hr: Number(trainAObj.travel_time_hr || trainBObj.travel_time_hr || 5.0),
      train_capacity: Number(trainAObj.train_capacity || trainBObj.train_capacity || 800),
      is_peak_hour: Number(trainAObj.is_peak_hour || trainBObj.is_peak_hour || 0),
      delay: Number(trainAObj.delay || trainBObj.delay || 0)
    };

    console.log("📤 Sending to AI:", payload);

    const res = await fetch("http://localhost:5000/ai-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ AI request failed:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText
      });
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("🤖 AI Response:", data);

    if (!data.success) {
      throw new Error(data.error || "AI returned unsuccessful response");
    }

    // Normalize response format
    return {
      success: true,
      priority_train: data.priority_train,
      reduced_train: data.reduced_train,
      suggested_speed: data.suggested_speed || 60,
      reason: data.reason || "AI-based conflict resolution",
      confidence: data.confidence || 75,
      decision: data.decision || "REDUCE_SPEED",
      probabilities: data.probabilities,
      priority_analysis: data.priority_analysis
    };

  } catch (err) {
    console.error("❌ AI RESOLUTION FAILED:", err);
    
    // Return fallback decision instead of failing completely
    return {
      success: false,
      error: err.message,
      priority_train: conflict.trainA || conflict.leadingTrain || conflict.train1,
      reduced_train: conflict.trainB || conflict.followingTrain || conflict.train2,
      suggested_speed: 60,
      decision: "MANUAL_INTERVENTION",
      reason: `AI resolution failed: ${err.message}. Manual intervention required.`,
      confidence: 0
    };
  }
}