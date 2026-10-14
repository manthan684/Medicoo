import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BASE = "http://localhost:5000/api";

const money = (n) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;
const label = (m) =>
  `${m.name}${m.strengthValue != null ? ` ${m.strengthValue} ${m.strengthUnit || ""}` : ""}`;
const day = (d) => new Date(d).toLocaleDateString();

function Stat({ title, value, note, color = "text-gray-900" }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </div>
  );
}

// small bar chart: money from supplies, one bar for each of the last 30 days
function MiniChart({ days }) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  const W = 600;
  const H = 120;
  const gap = 4;
  const barW = W / days.length - gap;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 20}`}
      className="w-full text-blue-600"
      role="img"
      aria-label="Money from supplies in the last 30 days"
    >
      {days.map((d, i) => {
        const h = Math.max((d.amount / max) * H, d.amount > 0 ? 3 : 1);
        return (
          <rect
            key={d.date}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            rx="2"
            fill="currentColor"
            opacity={d.amount > 0 ? 1 : 0.2}
          >
            <title>{`${d.date}: ${d.supplies} supplies, ${money(d.amount)}`}</title>
          </rect>
        );
      })}
      <text x="0" y={H + 15} fontSize="10" fill="#6b7280">
        {days[0].date}
      </text>
      <text x={W} y={H + 15} fontSize="10" fill="#6b7280" textAnchor="end">
        {days[days.length - 1].date}
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${BASE}/dashboard`);
        setData(res.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
      try {
        const res = await axios.get(`${BASE}/alerts/summary`);
        setAlerts(res.data);
      } catch {
        // the alert numbers are optional, so a failure here must not break the page
      }
    };
    load();
  }, []);

  if (error) return <p className="alert-error">Dashboard could not load: {error}</p>;
  if (!data) return <p className="text-gray-500">Loading...</p>;

  const { stock, today, month, topShops, topMedicines, recentSupplies, recentStockIns, perDay } = data;
  const alertTotal = alerts
    ? alerts.expired + alerts.expiringSoon + alerts.lowStock + (alerts.outOfStock || 0)
    : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Dashboard</h1>

      {/* the main numbers */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          title="Usable stock"
          value={stock.units}
          note={`${stock.medicines} medicines, ${stock.batches} batches`}
        />
        <Stat
          title="Today"
          value={money(today.amount)}
          note={`${today.supplies} supplies, ${today.units} units`}
        />
        <Stat
          title="This month"
          value={money(month.amount)}
          note={`${month.supplies} supplies, ${month.units} units`}
        />
        <Stat
          title="Alerts"
          value={alertTotal}
          color={alertTotal > 0 ? "text-red-600" : "text-green-600"}
          note={alertTotal > 0 ? "Need attention" : "All fine"}
        />
      </div>

      {/* alerts */}
      {alerts && alertTotal > 0 && (
        <div className="card mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Needs attention</h2>
            <Link to="/stock" className="text-sm font-medium text-blue-600 hover:underline">
              View stock
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {alerts.expired > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                Expired in store: {alerts.expired}
              </span>
            )}
            {alerts.expiringSoon > 0 && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                Expiring in {alerts.days} days: {alerts.expiringSoon}
              </span>
            )}
            {alerts.lowStock > 0 && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
                Low stock: {alerts.lowStock}
              </span>
            )}
            {alerts.outOfStock > 0 && (
              <span className="rounded-full bg-gray-200 px-3 py-1 text-gray-700">
                Out of stock: {alerts.outOfStock}
              </span>
            )}
          </div>
        </div>
      )}

      {/* chart */}
      <div className="card mb-8">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Last 30 days</h2>
        <p className="mb-3 text-xs text-gray-500">Money from supplies, one bar for each day</p>
        <MiniChart days={perDay} />
      </div>

      {/* top 5 tables */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Top shops this month</h2>
          {topShops.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No supplies this month</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 font-medium">Shop</th>
                  <th className="py-2 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topShops.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 font-medium text-gray-900">{s.name}</td>
                    <td className="py-2 text-right">{s.units}</td>
                    <td className="py-2 text-right">{money(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Top medicines this month</h2>
          {topMedicines.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No supplies this month</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 font-medium">Medicine</th>
                  <th className="py-2 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topMedicines.map((m, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 font-medium text-gray-900">{label(m)}</td>
                    <td className="py-2 text-right">{m.units}</td>
                    <td className="py-2 text-right">{money(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* recent work */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent supplies</h2>
            <Link to="/supply" className="text-sm font-medium text-blue-600 hover:underline">
              New supply
            </Link>
          </div>
          {recentSupplies.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No supplies yet</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {recentSupplies.map((s) => (
                <li key={s._id} className="flex justify-between py-2">
                  <span>
                    <span className="font-medium text-gray-900">{s.shop}</span>
                    <span className="block text-xs text-gray-500">
                      {day(s.date)}, {s.medicines} medicines, {s.units} units
                    </span>
                  </span>
                  <span className="font-medium">{money(s.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent stock-ins</h2>
            <Link to="/stock-in" className="text-sm font-medium text-blue-600 hover:underline">
              New stock-in
            </Link>
          </div>
          {recentStockIns.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No stock-ins yet</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {recentStockIns.map((s) => (
                <li key={s._id} className="flex justify-between py-2">
                  <span>
                    <span className="font-medium text-gray-900">{s.supplier}</span>
                    <span className="block text-xs text-gray-500">
                      {day(s.date)}, {s.medicines} medicines
                    </span>
                  </span>
                  <span className="font-medium">{s.units} units</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}