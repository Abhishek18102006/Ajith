import TrainCard from "./TrainCard";
import TrainDetails from "./TrainDetails";

export default function TrainPrecedencePanel({
  trains,
  selectedTrain,
  onSelect,
  onInjectDelay
}) {
  return (
    <div className="train-cards-layout">
      {/* LEFT: TRAIN LIST */}
      <div className="train-card-list">
        {trains.length === 0 && <p>No trains loaded</p>}

        {trains.map((train, index) => (
          <TrainCard
            key={train.train_id}
            train={train}
            index={index}
            isSelected={selectedTrain?.train_id === train.train_id}
            onClick={() => onSelect(train)}   {/* 🔥 THIS WAS MISSING */}
          />
        ))}
      </div>

      {/* RIGHT: TRAIN DETAILS */}
      <TrainDetails
        train={selectedTrain}
        onInjectDelay={onInjectDelay}
      />
    </div>
  );
}
