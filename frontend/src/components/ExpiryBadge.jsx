import { expiryStatus } from "../utils/expiry";

const styles = {
  expired: "bg-red-100 text-red-700",
  soon: "bg-orange-100 text-orange-700",
  ok: "bg-green-100 text-green-700",
};

export default function ExpiryBadge({ date }) {
  const { status, days } = expiryStatus(date);
  const text =
    status === "expired" ? "Expired" : status === "soon" ? `${days} days left` : "OK";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {text}
    </span>
  );
}