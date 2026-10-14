import { useState, useEffect } from "react";
import axios from "axios";
import ExpiryBadge from "../components/ExpiryBadge";
const API = "http://localhost:5000/api/stockin";
const MEDICINES_API = "http://localhost:5000/api/medicines";

const emptyRow = { medicine: "", batchNumber: "", expiryDate: "", quantity: "" };

const medicineLabel = (m) =>
  `${m.name}${m.strengthValue != null ? ` ${m.strengthValue} ${m.strengthUnit || ""}` : ""} (${m.type})`;

// red = expired, orange = within 60 days, green = fine
function lokiExpiryBadge({ date }) {
  const days = Math.ceil((new Date(date) - new Date()) / 86400000);
  let text = "OK";
  let color = "bg-green-100 text-green-700";
  if (days < 0) {
    text = "Expired";
    color = "bg-red-100 text-red-700";
  } else if (days <= 60) {
    text = `${days} days left`;
    color = "bg-orange-100 text-orange-700";
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

export default function StockIn() {
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [items, setItems] = useState([emptyRow]);

  const fetchAll = async () => {
    try {
      const [medRes, histRes] = await Promise.all([
        axios.get(MEDICINES_API),
        axios.get(API),
      ]);
      setMedicines(medRes.data);
      setHistory(histRes.data);
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

  const addRow = () => setItems([...items, emptyRow]);

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    setItems(
      items.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    const data = {
      supplierName,
      items: items.map((row) => ({
        medicine: row.medicine,
        batchNumber: row.batchNumber,
        expiryDate: row.expiryDate,
        quantity: Number(row.quantity),
      })),
    };

    try {
      await axios.post(API, data);
      setSuccess("Stock-in saved");
      setSupplierName("");
      setItems([emptyRow]);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="alert-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title">Stock-in</h1>
      <p className="page-sub">
        Receive medicines into inventory with a batch number, expiry date and quantity.
      </p>

      {medicines.length === 0 ? (
        <div className="card mb-8 text-slate-600">
          Add some medicines first (Medicines page).
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
          <div>
            <h2 className="card-title">Receive stock</h2>
            <p className="card-sub">Add one or more medicines to this stock-in entry.</p>
          </div>

          <div>
            <label className="field-label">Supplier / company (optional)</label>
            <input
              className="input"
              placeholder="Example: ABC Pharma"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>

          {/* column names, shown on wide screens */}
          <div className="hidden grid-cols-12 gap-2 text-sm font-medium text-slate-700 md:grid">
            <span className="col-span-4">Medicine</span>
            <span className="col-span-2">Batch no.</span>
            <span className="col-span-3">Expiry date</span>
            <span className="col-span-2">Quantity</span>
          </div>

          {items.map((row, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <select
                className="input md:col-span-4"
                value={row.medicine}
                onChange={(e) => updateRow(index, "medicine", e.target.value)}
              >
                <option value="">Choose medicine</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {medicineLabel(m)}
                  </option>
                ))}
              </select>

              <input
                className="input md:col-span-2"
                placeholder="B-102"
                value={row.batchNumber}
                onChange={(e) => updateRow(index, "batchNumber", e.target.value)}
              />

              <input
                className="input md:col-span-3"
                type="date"
                value={row.expiryDate}
                onChange={(e) => updateRow(index, "expiryDate", e.target.value)}
              />

              <input
                className="input md:col-span-2"
                type="number"
                min="1"
                placeholder="0"
                value={row.quantity}
                onChange={(e) => updateRow(index, "quantity", e.target.value)}
              />

              <button
                type="button"
                className="btn btn-danger px-2 md:col-span-1"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            </div>
          ))}

          {formError && <p className="alert-error">{formError}</p>}
          {success && <p className="alert-success">{success}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
            <button type="button" className="btn btn-secondary" onClick={addRow}>
              + Add another medicine
            </button>
            <button type="submit" className="btn btn-primary">
              Save stock-in
            </button>
          </div>
        </form>
      )}

      <h2 className="mb-3 text-lg font-semibold text-slate-900">History</h2>
      {history.length === 0 ? (
        <p className="text-slate-500">No stock-ins yet</p>
      ) : (
        <div className="space-y-4">
          {history.map((s) => (
            <div key={s._id} className="card">
              <div className="mb-4 flex items-center justify-between">
                <span className="card-title">{s.supplierName || "No supplier"}</span>
                <span className="text-sm text-slate-500">
                  {new Date(s.receivedDate).toLocaleDateString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th className="text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map((it, i) => (
                      <tr key={i}>
                        <td className="font-medium text-slate-900">
                          {it.medicine ? medicineLabel(it.medicine) : "Deleted medicine"}
                        </td>
                        <td>{it.batchNumber}</td>
                        <td>
                          {new Date(it.expiryDate).toLocaleDateString()}{" "}
                          <ExpiryBadge date={it.expiryDate} />
                        </td>
                        <td className="text-right font-semibold text-slate-900">
                          {it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}