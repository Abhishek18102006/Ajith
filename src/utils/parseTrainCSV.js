export function parseTrainCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(row => {
    const values = row.split(",");
    const data = {};

    headers.forEach((h, i) => {
      data[h.trim()] = values[i]?.trim() || "";
    });

    return {
      train_id: data.train_id,
      train_name: data.train_name,
      source: data.source,
      destination: data.destination,
      arrival_time: data.arrival_time,

      priority: Number(data.priority),
      max_speed: Number(data.max_speed),

      // 🔥 REQUIRED FOR CONFLICT + AI
      block_id: data.block_id,
      approach_dir: data.approach_dir,
      line: data.line,
      clearance_min: Number(data.clearance_min || 3),

      // runtime state
      delay: 0,
      status: "ON TIME"
    };
  });
}
