import { effectiveArrival } from "./time";

/**
 * Detect loop line conflicts (same direction, insufficient gap)
 */
export function detectLoopLineConflicts(trains) {
  const conflicts = [];

  const sorted = [...trains]
    .filter(t => t.block_id !== undefined)
    .sort((a, b) => effectiveArrival(a) - effectiveArrival(b));

  for (let i = 0; i < sorted.length - 1; i++) {
    const lead = sorted[i];
    const follow = sorted[i + 1];

    if (lead.block_id !== follow.block_id) continue;
    if (lead.approach_dir !== follow.approach_dir) continue;

    const leadTime = lead.arrival || effectiveArrival(lead);
    const followTime = follow.arrival || effectiveArrival(follow);
    const gap = followTime - leadTime;

    console.log(`🔍 Loop line check: Train ${lead.train_id} → ${follow.train_id}`, {
      block: lead.block_id,
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
      conflicts.push({
        type: "LOOP_LINE",
        block_id: lead.block_id,
        leadingTrain: lead.train_id,
        followingTrain: follow.train_id,
        timeDiff: Math.round(gap)
      });
    }
  }

  return conflicts;
}