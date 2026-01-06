import { parseTrainCSV } from "../utils/parseTrainCSV";

export default function CSVUpload({ onLoad }) {
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const trains = parseTrainCSV(reader.result);

      // ✅ Sort by arrival time (precedence)
      trains.sort((a, b) =>
        a.arrival_time.localeCompare(b.arrival_time)
      );

      onLoad(trains);
    };
    reader.readAsText(file);
  };

  return (
    <input
      type="file"
      accept=".csv"
      onChange={handleFile}
    />
  );
}
