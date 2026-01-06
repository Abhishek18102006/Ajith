export default function TrainCard({ train, index, onClick }) {
  return (
    <div className="train-card" onClick={onClick}>
      <div className="train-rank">{index}</div>

      <div className="train-main">
        <strong>{train.train_id}</strong> {train.train_name}
        <div className="route">
          {train.source} → {train.destination}
        </div>
        <div className="meta">
          Arrival: {train.arrival_time} |
          Priority: {train.priority}
        </div>
      </div>

      <div className="train-status">
        {train.delay > 0 ? (
          <span className="delayed">+{train.delay} min</span>
        ) : (
          <span className="ontime">ON TIME</span>
        )}
      </div>
    </div>
  );
}
