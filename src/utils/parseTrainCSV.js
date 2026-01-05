export default function parseTrainCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");

    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = values[i]?.trim();
    });

    return {
      train_id: Number(row.train_id),
      train_name: row.train_name,
      source: row.source,
      destination: row.destination,
      arrival_time: row.arrival_time,
      departure_time: row.departure_time,
      train_type: row.train_type,
      priority: Number(row.priority),
      max_speed: Number(row.max_speed),
      delay: 0,              // 🔥 REQUIRED
      status: "ON_TIME",     // 🔥 REQUIRED
      conflict: false        // 🔥 REQUIRED
    };
  });
}
