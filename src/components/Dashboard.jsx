import TrainPrecedencePanel from "./TrainPrecedencePanel";
import SelectedTrainPanel from "./SelectedTrainPanel";
import CSVUpload from "./CSVUpload";
import { useState } from "react";
import { useTrains } from "../context/TrainContext";

export default function Dashboard() {
  const { trains, setTrains } = useTrains();
  const [selectedTrain, setSelectedTrain] = useState(null);

  const toMin = t => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const injectDelay = (trainId, delay) => {
    setTrains(prev => {
      // apply delay
      const updated = prev.map(t =>
        t.train_id === trainId
          ? { ...t, delay, status: "DELAYED" }
          : t
      );

      const delayedTrain = updated.find(t => t.train_id === trainId);
      if (!delayedTrain) return updated;

      const clearance = 3;
      const dStart = toMin(delayedTrain.arrival_time) + delay;
      const dEnd = dStart + clearance;

      const conflicts = updated.filter(t => {
        if (t.train_id === delayedTrain.train_id) return false;
        if (t.block_id !== delayedTrain.block_id) return false;
        if (t.approach_dir === delayedTrain.approach_dir) return false;

        const tStart = toMin(t.arrival_time);
        const tEnd = tStart + clearance;

        return dStart < tEnd && tStart < dEnd;
      });

      return updated.map(t =>
        conflicts.some(c => c.train_id === t.train_id)
          ? { ...t, conflict: true }
          : t
      );
    });
  };

  return (
    <>
      <div className="card-grid">
        <StatusCard title="Active Trains" value={trains.length} />
        <StatusCard
          title="Delayed Trains"
          value={trains.filter(t => t.delay > 0).length}
        />
      </div>

      <CSVUpload setTrains={setTrains} />

      <div className="dashboard-grid">
        <TrainPrecedencePanel
          trains={trains}
          onSelect={setSelectedTrain}
        />

        <SelectedTrainPanel
          train={selectedTrain}
          onInjectDelay={injectDelay}
        />
      </div>
    </>
  );
}

function StatusCard({ title, value }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <p className="card-value">{value}</p>
    </div>
  );
}
