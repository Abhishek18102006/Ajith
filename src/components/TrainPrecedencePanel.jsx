import CSVUpload from "./CSVUpload";
import TrainCard from "./TrainCard";

export default function TrainPrecedencePanel({ trains, setTrains, onSelect }) {
  return (
    <div className="table-card">
      <h3>Train Precedence</h3>

      <CSVUpload onLoad={setTrains} />

      {trains.length === 0 ? (
        <p>No train data uploaded</p>
      ) : (
        <div className="train-card-list">
          {trains.map((t, index) => (
            <TrainCard
              key={t.train_id}
              train={t}
              index={index + 1}
              onClick={() => onSelect(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
