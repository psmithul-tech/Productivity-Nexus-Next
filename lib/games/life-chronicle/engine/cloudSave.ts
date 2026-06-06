export function generatePlayerId() {
  const stored = localStorage.getItem("playerId");
  if (stored) return stored;
  const newId = crypto.randomUUID();
  localStorage.setItem("playerId", newId);
  return newId;
}
