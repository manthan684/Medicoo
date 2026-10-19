import { API_URL } from "../api";
import { useState, useEffect } from "react";
import axios from "axios";
import ExpiryBadge from "../components/ExpiryBadge";
import { expiryStatus } from "../utils/expiry";

const API = `${API_URL}/api/batches`;

const label = (m) =>
  `${m.name}${m.strengthValue != null ? ` ${m.strengthValue} ${m.strengthUnit || ""}` : ""}`;

function Stat({ title, value, color = "text-slate-900" }) {
  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>
        {value}
      </p>
    </div>
  );
}

export default function Stock() {
  const [summary, setSummary] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, soon, expired

  const fetchAll = async () => {
    try {
      const [sumRes, batchRes] = await Promise.all([
        axios.get(`${API}/summary`),
        axios.get(API),
      ]);
      setSummary(sumRes.data);
      setBatches(batchRes.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const expiredCount = batches.filter(
    (b) => expiryStatus(b.expiryDate).status === "expired"
  ).length;
  const soonCount = batches.filter(
    (b) => expiryStatus(b.expiryDate).status === "soon"
  ).length;

  const visibleBatches = batches.filter((b) => {
    const text = `${b.medicine ? label(b.medicine) : ""} ${b.batchNumber}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const status = expiryStatus(b.expiryDate).status;
    const matchesFilter = filter === "all" || status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="alert-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title">Stock</h1>
      <p className="page-sub">
        Review usable stock and see which batches need attention.
      </p>

      {/* the 4 numbers on top */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat title="Medicines in stock" value={summary.length} />
        <Stat title="Batches with stock" value={batches.length} />
        <Stat title="Expiring in 60 days" value={soonCount} color="text-orange-600" />
        <Stat title="Expired batches" value={expiredCount} color="text-red-600" />
      </div>

      {/* usable stock per medicine */}
      <div className="card mb-8">
        <h2 className="card-title">Usable stock per medicine</h2>
        <p className="card-sub mb-5">
          Expired batches are not counted here, because they must never be given out.
        </p>

        {summary.length === 0 ? (
          <p className="empty">No usable stock yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Type</th>
                  <th className="text-right">Usable quantity</th>
                  <th className="text-right">Batches</th>
                  <th>Nearest expiry</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.medicineId}>
                    <td className="font-medium text-slate-900">{label(s)}</td>
                    <td>
                      <span className="chip">{s.type}</span>
                    </td>
                    <td className="text-right font-semibold text-slate-900">
                      {s.totalQuantity}
                    </td>
                    <td className="text-right">{s.batches}</td>
                    <td>
                      {new Date(s.nearestExpiry).toLocaleDateString()}{" "}
                      <ExpiryBadge date={s.nearestExpiry} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* every batch */}
      <div className="card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title">All batches ({visibleBatches.length})</h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="input w-44"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All batches</option>
              <option value="soon">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
            <input
              className="input w-64"
              placeholder="Search medicine or batch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {visibleBatches.length === 0 ? (
          <p className="empty">No batches to show</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th className="text-right">Quantity left</th>
                </tr>
              </thead>
              <tbody>
                {visibleBatches.map((b) => (
                  <tr key={b._id}>
                    <td className="font-medium text-slate-900">
                      {b.medicine ? label(b.medicine) : "Deleted medicine"}
                    </td>
                    <td>{b.batchNumber}</td>
                    <td>
                      {new Date(b.expiryDate).toLocaleDateString()}{" "}
                      <ExpiryBadge date={b.expiryDate} />
                    </td>
                    <td className="text-right font-semibold text-slate-900">
                      {b.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}