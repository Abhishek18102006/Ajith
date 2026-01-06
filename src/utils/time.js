export function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function effectiveArrival(train) {
  return timeToMinutes(train.arrival_time) + (train.delay || 0);
}
