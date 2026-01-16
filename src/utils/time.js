/**
 * Convert HH:MM time string to minutes since midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculate effective arrival time including delay
 * Uses the pre-calculated 'arrival' field if available
 */
export function effectiveArrival(train) {
  // Use the pre-calculated 'arrival' field if it exists (in minutes)
  if (train.arrival !== undefined && train.arrival !== null) {
    return Number(train.arrival);
  }
  
  // Otherwise calculate from arrival_time + delay
  const baseMinutes = timeToMinutes(train.arrival_time);
  const delayMinutes = Number(train.delay) || 0;
  return baseMinutes + delayMinutes;
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(timeStr, minutesToAdd) {
  const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
  return minutesToTime(totalMinutes);
}