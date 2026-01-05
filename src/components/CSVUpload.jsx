import { parseTrainCSV } from "../utils/parseTrainCSV";

export default function CSVUpload({ setTrains }) {
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const parsed = parseTrainCSV(event.target.result);

      const initialized = parsed.map(t => ({
        ...t,
        delay: 0,
        conflict: false,
        status: "ON_TIME"
      }));

      setTrains(initialized);
    };

    reader.readAsText(file);
  };

  return (
    <div className="table-card">
      <h4>Upload Train Schedule</h4>
      <input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
    </div>
  );
}
