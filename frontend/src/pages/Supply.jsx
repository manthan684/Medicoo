import { useState, useEffect } from "react";
import axios from "axios";

const BASE = "http://localhost:5000/api";
const emptyRow = { medicine: "", quantity: "" };

const label = (m) =>
  `${m.name}${m.strengthValue != null ? ` ${m.strengthValue} ${m.strengthUnit || ""}` : ""}`;

const money = (n) => `Rs ${Number(n).toFixed(2)}`;

// one supply: used for the receipt and for the history
function SupplyCard({ supply, highlight }) {
  return (
    <div className={`card ${highlight ? "border-green-300 bg-green-50" : ""}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="card-title">
            {supply.shop ? supply.shop.name : "Deleted shop"}
          </p>
          <p className="text-sm text-slate-500">
            {new Date(supply.supplyDate).toLocaleString()}
          </p>
        </div>
        <p className="text-xl font-semibold tracking-tight text-slate-900">
          {money(supply.totalAmount)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batches used</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {supply.items.map((it, i) => (
              <tr key={i} className="align-top">
                <td className="font-medium text-slate-900">
                  {it.medicine && it.medicine.name ? label(it.medicine) : "Medicine"}
                </td>
                <td>
                  {it.batches.map((b) => (
                    <div key={b.batch} className="text-sm text-slate-600">
                      {b.batchNumber} (exp {new Date(b.expiryDate).toLocaleDateString()})
                      {" x "}
                      {b.quantity}
                    </div>
                  ))}
                </td>
                <td className="text-right">{it.quantity}</td>
                <td className="text-right">{money(it.price)}</td>
                <td className="text-right font-semibold text-slate-900">
                  {money(it.price * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Supply() {
  const [shops, setShops] = useState([]);
  const [stock, setStock] = useState([]); // usable stock per medicine
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [shopId, setShopId] = useState("");
  const [items, setItems] = useState([emptyRow]);
  const [filterShop, setFilterShop] = useState("");

  const loadBase = async () => {
    try {
      const [shopRes, stockRes] = await Promise.all([
        axios.get(`${BASE}/shops`),
        axios.get(`${BASE}/batches/summary`),
      ]);
      setShops(shopRes.data);
      setStock(stockRes.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (shop) => {
    try {
      const res = await axios.get(`${BASE}/supply`, {
        params: shop ? { shop } : {},
      });
      setHistory(res.data);
      setHistoryError("");
    } catch (err) {
      setHistoryError(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    loadHistory(filterShop);
  }, [filterShop]);

  // ----- the 3 row functions -----
  const addRow = () => setItems([...items, emptyRow]);

  const removeRow = (index) => {
    if (items.length === 1) {
      setItems([emptyRow]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    setItems(
      items.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const stockOf = (medicineId) => stock.find((s) => s.medicineId === medicineId);

  // hide medicines that are already chosen in another row
  const optionsFor = (index) =>
    stock.filter(
      (s) =>
        s.medicineId === items[index].medicine ||
        !items.some((r, i) => i !== index && r.medicine === s.medicineId)
    );

  const filledRows = items.filter((r) => r.medicine && Number(r.quantity) > 0);
  const totalUnits = filledRows.reduce((sum, r) => sum + Number(r.quantity), 0);

  // ----- send to the backend -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setReceipt(null);

    if (!shopId) return setFormError("Choose a shop");

    const rows = items.filter((r) => r.medicine || r.quantity);
    if (rows.length === 0) return setFormError("Add at least one medicine");
    if (rows.some((r) => !r.medicine || !(Number(r.quantity) >= 1))) {
      return setFormError("Each row needs a medicine and a quantity of 1 or more");
    }

    setSaving(true);
    try {
      const res = await axios.post(`${BASE}/supply`, {
        shop: shopId,
        items: rows.map((r) => ({
          medicine: r.medicine,
          quantity: Number(r.quantity),
        })),
      });

      // add names to the answer, so the receipt can show them
      const medicineMap = Object.fromEntries(stock.map((s) => [s.medicineId, s]));
      setReceipt({
        ...res.data,
        shop: shops.find((s) => s._id === shopId),
        items: res.data.items.map((it) => ({
          ...it,
          medicine: medicineMap[it.medicine] || null,
        })),
      });

      setShopId("");
      setItems([emptyRow]);
      loadBase(); // the stock numbers changed
      loadHistory(filterShop);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="alert-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title">New supply</h1>
      <p className="page-sub">
        Send medicines to a shop. Stock is taken from the oldest expiry first.
      </p>

      {receipt && (
        <div className="mb-8">
          <p className="alert-success mb-3">
            Supply saved. The stock was reduced, oldest expiry first.
          </p>
          <SupplyCard supply={receipt} highlight />
        </div>
      )}

      {shops.length === 0 ? (
        <div className="card mb-8 text-slate-600">Add a shop first (Shops page).</div>
      ) : stock.length === 0 ? (
        <div className="card mb-8 text-slate-600">
          There is no usable stock. Add stock on the Stock-in page first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
          <div>
            <h2 className="card-title">Supply details</h2>
            <p className="card-sub">Choose a shop, then add the medicines and quantities.</p>
          </div>

          <div>
            <label className="field-label">Shop</label>
            <select
              className="input md:max-w-md"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
            >
              <option value="">Choose a shop</option>
              {shops.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} - {s.ownerName}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden grid-cols-12 gap-2 text-sm font-medium text-slate-700 md:grid">
            <span className="col-span-7">Medicine</span>
            <span className="col-span-3">Quantity</span>
          </div>

          {items.map((row, index) => {
            const s = stockOf(row.medicine);
            const tooMany = s && Number(row.quantity) > s.totalQuantity;
            return (
              <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-12">
                <div className="md:col-span-7">
                  <select
                    className="input"
                    value={row.medicine}
                    onChange={(e) => updateRow(index, "medicine", e.target.value)}
                  >
                    <option value="">Choose medicine</option>
                    {optionsFor(index).map((m) => (
                      <option key={m.medicineId} value={m.medicineId}>
                        {label(m)} ({m.type})
                      </option>
                    ))}
                  </select>
                  {s && (
                    <p className="mt-1.5 text-sm text-slate-500">
                      In stock: {s.totalQuantity} (usable, not expired)
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, "quantity", e.target.value)}
                  />
                  {tooMany && (
                    <p className="mt-1.5 text-sm text-orange-600">
                      Only {s.totalQuantity} in stock
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    className="btn btn-danger w-full"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <button type="button" className="btn btn-secondary" onClick={addRow}>
            + Add another medicine
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              {filledRows.length} medicine(s), {totalUnits} units
            </p>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save supply"}
            </button>
          </div>

          {formError && <p className="alert-error">{formError}</p>}
        </form>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Supply history</h2>
        <select
          className="input md:w-56"
          value={filterShop}
          onChange={(e) => setFilterShop(e.target.value)}
        >
          <option value="">All shops</option>
          {shops.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {historyError ? (
        <p className="alert-error">History could not load: {historyError}</p>
      ) : history.length === 0 ? (
        <p className="text-slate-500">No supplies yet</p>
      ) : (
        <div className="space-y-4">
          {history.map((s) => (
            <SupplyCard key={s._id} supply={s} />
          ))}
        </div>
      )}
    </div>
  );
}