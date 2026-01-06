import { effectiveArrival } from "./time";

export function detectBlockConflicts(trains) {
  const conflicts = [];

  for (let i = 0; i < trains.length; i++) {
    for (let j = i + 1; j < trains.length; j++) {
      const a = trains[i];
      const b = trains[j];

      if (!a.block_id || !b.block_id) continue;
      if (a.block_id !== b.block_id) continue;
      if (a.approach_dir === b.approach_dir) continue;

      const ta = effectiveArrival(a);
      const tb = effectiveArrival(b);
      const clearance = Number(a.clearance_min || 3);

      if (Math.abs(ta - tb) <= clearance) {
        conflicts.push({
          block_id: a.block_id,
          trainA: a.train_id,
          trainB: b.train_id,
          timeDiff: Math.abs(ta - tb),
          trainAObj: a,
          trainBObj: b
        });
      }
    }
  }

  return conflicts;
}
