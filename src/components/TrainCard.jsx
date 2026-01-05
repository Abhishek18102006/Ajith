export default function TrainCard({
  train,
  index,
  isSelected,
  onClick
}) {
  return (
    <div
      className={`train-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}                 {/* 🔥 REQUIRED */}
    >
      <div className="train-rank">{index + 1}</div>

      <div className="train-main">
        <strong>
          {train.train_id} — {train.train_name}
        </strong>

        <div className="route">
          {train.source} → {train.destination}
        </div>

        <div className="meta">
          Arrival: {train.arrival_time} | Priority: {train.priority}
        </div>
      </div>

      <div className="train-status">
        {train.delay > 0 ? (
          <span className="delayed">DELAYED +{train.delay} min</span>
        ) : (
          <span className="ontime">ON TIME</span>
        )}
      </div>
    </div>
  );
}
