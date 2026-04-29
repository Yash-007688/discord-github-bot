export function calculateStreakFromEvents(events = []) {
  const days = new Set(
    events
      .filter((event) => event.type === "PushEvent")
      .map((event) => new Date(event.created_at).toISOString().slice(0, 10))
  );

  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const day = cursor.toISOString().slice(0, 10);
    if (!days.has(day)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
