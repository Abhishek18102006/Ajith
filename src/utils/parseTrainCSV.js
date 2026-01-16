/**
 * Enhanced CSV Parser - Uses all CSV fields directly
 * No auto-generation, preserves conflict-free schedule
 */

export function parseTrainCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map((row, index) => {
    const values = row.split(",");
    const data = {};

    headers.forEach((h, i) => {
      data[h] = values[i]?.trim() || "";
    });

    // ⭐ USE CSV DATA DIRECTLY - NO AUTO-GENERATION
    return {
      // Basic identification
      train_id: String(data.train_id || index + 1),
      train_name: data.train_name || "Unknown Train",
      
      // Original data from CSV (for AI model)
      passengers: Number(data.passengers) || 0,
      distance_km: Number(data.distance_km) || 0,
      travel_time_hr: Number(data.travel_time_hr) || 0,
      train_capacity: Number(data.train_capacity) || 800,
      is_peak_hour: Number(data.is_peak_hour) || 0,
      
      // Route information
      source: data.source || "Unknown",
      destination: data.destination || "Unknown",
      
      // ⭐ TIMING - Use CSV values (conflict-free)
      arrival_time: data.arrival_time || "06:00",
      departure_time: data.departure_time || data.arrival_time || "06:00",
      
      // Train classification
      train_type: data.train_type || getPriorityLabel(Number(data.priority) || 2),
      priority: Number(data.priority) || 2,
      max_speed: Number(data.max_speed) || 80, // Default speed if not provided
      
      // ⭐ CONFLICT DETECTION FIELDS - Use CSV values (unique blocks)
      block_id: data.block_id || `BLK_${data.train_id}`,
      approach_dir: data.approach_dir || "UP",
      line: data.line || ((Number(data.priority) || 2) <= 2 ? "LOOP" : "MAIN"),
      clearance_min: Number(data.clearance_min) || 3,
      
      // Junction fields
      next_junction: data.next_junction || null,
      distance_to_junction: Number(data.distance_to_junction) || 0,
      junction_clearance_min: Number(data.junction_clearance_min) || 5,
      
      // Navigation state
      current_block: data.block_id || `BLK_${data.train_id}`,
      next_block: data.next_block || null,
      
      // ⭐ RUNTIME STATE - Initialize as conflict-free
      delay: 0,
      status: "ON TIME",
      conflict: false,
      conflict_reason: null,
      cleared: false,
      
      // Additional metadata
      arrival: Number(data.arrival) || timeToMinutes(data.arrival_time || "06:00"),
      departure: Number(data.departure) || timeToMinutes(data.departure_time || "06:00")
    };
  });
}

/**
 * Helper: Convert HH:MM to minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Helper: Get priority label
 */
export function getPriorityLabel(priority) {
  const labels = {
    1: "Local",
    2: "Passenger",
    3: "Express",
    4: "Premium"
  };
  return labels[priority] || "Passenger";
}

/**
 * Helper: Get priority color
 */
export function getPriorityColor(priority) {
  const colors = {
    1: "#16a34a",  // Green
    2: "#d97706",  // Orange
    3: "#0284c7",  // Blue
    4: "#dc2626"   // Red
  };
  return colors[priority] || "#64748b";
}