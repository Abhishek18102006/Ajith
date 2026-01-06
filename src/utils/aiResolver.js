export async function resolveConflictAI(conflict) {
  const body = {
    train1_id: conflict.trainA,
    train2_id: conflict.trainB,
    cp1: 3,
    cp2: 3
  };

  const res = await fetch("http://localhost:5000/resolve-conflict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return res.json();
}
