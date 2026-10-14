// tells if a date is expired, expiring soon (60 days or less), or fine
export function expiryStatus(date) {
  const now = new Date();
  const expiry = new Date(date);
  const days = Math.ceil((expiry - now) / 86400000);

  if (expiry < now) return { status: "expired", days };
  if (days <= 60) return { status: "soon", days };
  return { status: "ok", days };
}