import { effectiveArrival } from "./time";

/**
 * Detect loop line conflicts (same direction, insufficient gap)
 */
export function detectLoopLineConflicts(trains) {
  const conflicts = [];

  // ⭐ Filter out recently resolved trains (within last 5 minutes)
  const now = Date.now();
  const activeTrains = trains.filter(t => {
    if (t.status === "RESOLVED" && t.resolved_at) {
      const timeSinceResolved = now - t.resolved_at;
      return timeSinceResolved > 300000; // 5 minutes = 300,000ms
    }
    return t.status !== "RESOLVED" && t.block_id !== undefined;
  });

  const sorted = [...activeTrains]
    .sort((a, b) => effectiveArrival(a) - effectiveArrival(b));

  console.log(`🔍 Loop line detector: ${activeTrains.length} active trains`);

  for (let i = 0; i < sorted.length - 1; i++) {
    const lead = sorted[i];
    const follow = sorted[i + 1];

    // Must be same block
    if (lead.block_id !== follow.block_id) continue;
    
    // Must be same direction
    if (lead.approach_dir !== follow.approach_dir) continue;

    const leadTime = lead.arrival || effectiveArrival(lead);
    const followTime = follow.arrival || effectiveArrival(follow);
    const gap = followTime - leadTime;

    console.log(`🔍 Loop line check: Train ${lead.train_id} → ${follow.train_id}`, {
      block: lead.block_id,
      direction: lead.approach_dir,
      leadScheduled: lead.arrival_time,
      leadDelay: lead.delay,
      leadEffective: leadTime,
      followScheduled: follow.arrival_time,
      followDelay: follow.delay,
      followEffective: followTime,
      gap,
      threshold: 5
    });

    if (gap < 5 && gap >= 0) {
      console.log(`  ⚠️ LOOP LINE CONFLICT DETECTED!`, {
        lead: lead.train_id,
        follow: follow.train_id,
        gap: gap
      });

      conflicts.push({
        type: "LOOP_LINE",
        block_id: lead.block_id,
        leadingTrain: lead.train_id,
        followingTrain: follow.train_id,
        leadingTrainObj: lead,  // ⭐ CRITICAL: Include full train object
        followingTrainObj: follow, // ⭐ CRITICAL: Include full train object
        timeDiff: Math.round(gap * 10) / 10
      });
    }
  }

  console.log(`🔍 Total loop line conflicts found: ${conflicts.length}`);
  return conflicts;
}