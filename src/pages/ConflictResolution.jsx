import { useTrains } from "../context/TrainContext";
import { useState } from "react";
import mlApi from "../utils/mlApi";

export default function ConflictResolution() {
  const { trains, setTrains } = useTrains();
  const [decision, setDecision] = useState(null);

  const toMin = t => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const computeCheckpoint = (train, now) => {
    const arrival =
      toMin(train.arrival_time) + (train.delay || 0);
    const diff = arrival - now;

    if (diff <= 1) return 5;
    if (diff <= 3) return 4;
    if (diff <= 6) return 3;
    if (diff <= 10) return 2;
    return 1;
  };

  const conflicted = trains.filter(t => t.conflict);

  const resolveConflict = async (t1, t2) => {
    const now =
      new Date().getHours() * 60 + new Date().getMinutes();

    const features = [
      t1.priority,
      t2.priority,
      computeCheckpoint(t1, now),
      computeCheckpoint(t2, now)
    ];

    const res = await mlApi.predict(features);
    setDecision({ ...res, t1, t2 });
  };

  const acceptResolution = (priorityId, reducedId) => {
    setTrains(prev =>
      prev.map(t => {
        if (t.train_id === reducedId) {
          return {
            ...t,
            max_speed: Math.floor(t.max_speed * 0.6),
            conflict: false
          };
        }
        if (t.train_id === priorityId) {
          return { ...t, conflict: false };
        }
        return t;
      })
    );
    setDecision(null);
  };

  return (
    <div className="table-card">
      <h2>Conflict Resolution</h2>

      {conflicted.length < 2 && <p>No active conflicts</p>}

      {conflicted.length >= 2 && (
        <>
          <button onClick={() => resolveConflict(conflicted[0], conflicted[1])}>
            Resolve Conflict
          </button>
        </>
      )}

      {decision && (
        <>
          <h4>ML Recommendation</h4>
          <p>Priority Train: {decision.priorityTrain}</p>
          <p>Reduced Train: {decision.reducedTrain}</p>

          <button
            onClick={() =>
              acceptResolution(
                decision.priorityTrain,
                decision.reducedTrain
              )
            }
          >
            Accept Resolution
          </button>
        </>
      )}
    </div>
  );
}
