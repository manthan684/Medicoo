import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/alerts/summary";
const EVERY = 10000; // check every 10 seconds

// small line icons for the alert cards
const ICONS = {
  expired: "M12 8v4m0 4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  soon: "M12 6v6l4 2M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  low: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  arrow: "M9 5l7 7-7 7",
};

function Icon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function AlertCard({ icon, label, count, tone }) {
  return (
    <div
      className={`flex min-w-[220px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-sm ${tone}`}
    >
      <Icon name={icon} className="h-5 w-5 shrink-0" />
      <span className="font-medium">{label}</span>
      <span className="ml-auto rounded-full bg-white/70 px-2.5 py-0.5 text-sm font-semibold">
        {count}
      </span>
    </div>
  );
}

export default function AlertBar() {
  const [data, setData] = useState(null);

  // ask the backend now, and again every few seconds
  useEffect(() => {
    let stopped = false;

    const check = async () => {
      try {
        const res = await axios.get(API);
        if (!stopped) setData(res.data);
      } catch {
        // a failed check must never break the page
      }
    };

    check();
    const id = setInterval(check, EVERY);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  const total = data ? data.expired + data.expiringSoon + data.lowStock : 0;

  if (!data || total === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-stretch gap-3">
      {data.expired > 0 && (
        <AlertCard
          icon="expired"
          label="Expired in store"
          count={data.expired}
          tone="border-red-200 bg-red-50 text-red-700"
        />
      )}
      {data.expiringSoon > 0 && (
        <AlertCard
          icon="soon"
          label={`Expiring in ${data.days} days`}
          count={data.expiringSoon}
          tone="border-orange-200 bg-orange-50 text-orange-700"
        />
      )}
      {data.lowStock > 0 && (
        <AlertCard
          icon="low"
          label={`Low stock (under ${data.limit})`}
          count={data.lowStock}
          tone="border-amber-200 bg-amber-50 text-amber-800"
        />
      )}

      
    </div>
  );
}