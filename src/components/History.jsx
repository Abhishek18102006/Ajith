// src/components/History.jsx

export default function History({ history }) {
  return (
    <div className="table-card">
      <h3>📜 Cleared Train History</h3>

      {history.length === 0 ? (
        <p>No trains cleared yet</p>
      ) : (
        history.map((t, i) => (
          <div
            key={i}
            style={{
              background: "#f8fafc",
              padding: 10,
              borderRadius: 6,
              marginBottom: 6
            }}
          >
            <b>{t.train_id}</b> — {t.train_name}
          </div>
        ))
      )}
    </div>
  );
}
