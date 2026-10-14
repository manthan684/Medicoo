import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { expiryStatus } from "../utils/expiry";

const API = "http://localhost:5000/api/batches";
const EVERY = 10000; // look for new notifications every 10 seconds
const LOW_LIMIT = 100; // "low stock" means fewer than this many units

const label = (m) =>
  `${m.name}${m.strengthValue != null ? ` ${m.strengthValue} ${m.strengthUnit || ""}` : ""}`;

const daysLeft = (date) =>
  Math.ceil((new Date(date) - new Date()) / 86400000);

const dayText = (n) => (n === 1 ? "1 day" : `${n} days`);

// small line icons
const ICONS = {
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  expired: "M12 8v4m0 4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  soon: "M12 6v6l4 2M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
  low: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  ok: "M5 13l4 4L19 7",
};

const TONES = {
  expired: "bg-red-50 text-red-600",
  soon: "bg-orange-50 text-orange-600",
  low: "bg-amber-50 text-amber-600",
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

// turn the stock numbers into a list of notifications:
// expired first, then close to expiry, then low stock
function buildNotifications(summary, batches) {
  const list = [];

  batches.forEach((b) => {
    const status = expiryStatus(b.expiryDate).status;
    const name = b.medicine ? label(b.medicine) : "Deleted medicine";
    const when = new Date(b.expiryDate).toLocaleDateString();

    if (status === "expired") {
      list.push({
        id: `expired-${b._id}`,
        kind: "expired",
        rank: 0,
        sort: new Date(b.expiryDate).getTime(),
        title: `${name} has expired`,
        detail: `Batch ${b.batchNumber} · expired ${when} · ${b.quantity} left`,
      });
    } else if (status === "soon") {
      list.push({
        id: `soon-${b._id}`,
        kind: "soon",
        rank: 1,
        sort: new Date(b.expiryDate).getTime(),
        title: `${name} is close to expiry`,
        detail: `Batch ${b.batchNumber} · ${dayText(daysLeft(b.expiryDate))} left (${when}) · ${b.quantity} left`,
      });
    }
  });

  summary.forEach((s) => {
    if (s.totalQuantity < LOW_LIMIT) {
      list.push({
        id: `low-${s.medicineId}`,
        kind: "low",
        rank: 2,
        sort: s.totalQuantity,
        title: `${label(s)} is low on stock`,
        detail: `Only ${s.totalQuantity} left (under ${LOW_LIMIT})`,
      });
    }
  });

  return list.sort((a, b) => a.rank - b.rank || a.sort - b.sort);
}

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  // look at the stock now, and again every few seconds
  useEffect(() => {
    let stopped = false;

    const check = async () => {
      try {
        const [sumRes, batchRes] = await Promise.all([
          axios.get(`${API}/summary`),
          axios.get(API),
        ]);
        if (!stopped) setItems(buildNotifications(sumRes.data, batchRes.data));
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

  // close the box when you click outside it or press Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = items.length;

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${count ? `, ${count} alerts` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl motion-safe:animate-[pop-in_180ms_ease-out_both]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {count > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                {count} {count === 1 ? "alert" : "alerts"}
              </span>
            )}
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Icon name="ok" className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-900">All clear</p>
              <p className="text-sm text-slate-500">
                No expired, expiring or low stock right now.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    to="/stock"
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[n.kind]}`}
                    >
                      <Icon name={n.kind} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">
                        {n.title}
                      </span>
                      <span className="block text-sm text-slate-500">
                        {n.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}