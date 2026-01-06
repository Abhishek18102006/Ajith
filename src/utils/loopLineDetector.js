// src/utils/loopLineDetector.js

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// IMPORTANT: real railway logic
// effective arrival = scheduled arrival + delay
function effectiveArrival(train) {
  return toMinutes(train.arrival_time) + (train.delay || 0);
}

/**
 * LOOP LINE CONFLICT LOGIC
 *
 * Condition:
 * 1. Same block
 * 2. Same approach direction
 * 3. Leading train is delayed
 * 4. Following train arrives within clearance window
 */
export function detectLoopLineConflicts(trains) {
  const conflicts = [];

  for (let i = 0; i < trains.length; i++) {
    for (let j = 0; j < trains.length; j++) {
      if (i === j) continue;

      const lead = trains[i];
      const follow = trains[j];

      if (
        lead.block_id === follow.block_id &&
        lead.approach_dir === follow.approach_dir &&
        lead.delay > 0
      ) {
        const timeDiff =
          effectiveArrival(follow) - effectiveArrival(lead);

        if (
          timeDiff > 0 &&
          timeDiff <= (lead.clearance_min || 3)
        ) {
          conflicts.push({
            type: "LOOP_LINE",
            block_id: lead.block_id,
            leadingTrain: lead.train_id,
            followingTrain: follow.train_id,
            timeDiff,
            message: `Train ${follow.train_id} must be held in LOOP LINE behind delayed train ${lead.train_id}`
          });
        }
      }
    }
  }

  return conflicts;
}
