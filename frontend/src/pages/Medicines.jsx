import { API_URL } from "../api";
import { useState, useEffect } from "react";
import axios from "axios";

const API = `${API_URL}/api/medicines`;

const TYPES = ["tablet", "capsule", "syrup", "injection", "ointment", "drops", "other"];
const UNITS = ["mg", "g", "mcg", "ml", "IU", "%"];

const emptyForm = {
  name: "",
  type: "tablet",
  strengthValue: "",
  strengthUnit: "",
  price: "",
};

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const fetchMedicines = async () => {
    try {
      const res = await axios.get(API);
      setMedicines(res.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // inputs give text, so turn the numbers into real numbers
    const data = {
      name: form.name,
      type: form.type,
      strengthValue: form.strengthValue === "" ? null : Number(form.strengthValue),
      strengthUnit: form.strengthUnit === "" ? null : form.strengthUnit,
      price: form.price === "" ? "" : Number(form.price),
    };

    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, data);
      } else {
        await axios.post(API, data);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchMedicines();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name,
      type: m.type,
      strengthValue: m.strengthValue ?? "",
      strengthUnit: m.strengthUnit ?? "",
      price: m.price,
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      if (id === editingId) handleCancel();
      fetchMedicines();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const strengthText = (m) =>
    m.strengthValue != null ? `${m.strengthValue} ${m.strengthUnit || ""}` : "-";

  const visibleMedicines = medicines.filter((m) =>
    `${m.name} ${m.type}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="alert-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title">Medicines</h1>
      <p className="page-sub">
        Maintain the medicine catalogue, recorded strengths and selling prices.
      </p>

      <form onSubmit={handleSubmit} className="card mb-8">
        <h2 className="card-title">
          {editingId ? "Edit medicine" : "Add a new medicine"}
        </h2>
        <p className="card-sub mb-5">Medicine identity, strength and price</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Medicine name</label>
            <input
              className="input"
              name="name"
              placeholder="Example: Paracetamol"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="field-label">Type</label>
            <select
              className="input"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Strength (optional)</label>
            <div className="flex gap-2">
              <input
                className="input"
                name="strengthValue"
                type="number"
                min="0"
                placeholder="Example: 500"
                value={form.strengthValue}
                onChange={handleChange}
              />
              <select
                className="input w-36 shrink-0"
                name="strengthUnit"
                value={form.strengthUnit}
                onChange={handleChange}
              >
                <option value="">No unit</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Price (Rs)</label>
            <input
              className="input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Example: 2"
              value={form.price}
              onChange={handleChange}
            />
          </div>
        </div>

        {formError && <p className="alert-error mt-4">{formError}</p>}

        <div className="mt-5 flex justify-end gap-2">
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update medicine" : "Add medicine"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title">All medicines ({visibleMedicines.length})</h2>
          <input
            className="input md:max-w-xs"
            placeholder="Search by name or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {visibleMedicines.length === 0 ? (
          <p className="empty">
            {medicines.length === 0 ? "No medicines yet" : "No medicine matches your search"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Type</th>
                  <th>Strength</th>
                  <th>Price</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleMedicines.map((m) => (
                  <tr key={m._id}>
                    <td className="font-medium text-slate-900">{m.name}</td>
                    <td>
                      <span className="chip">{m.type}</span>
                    </td>
                    <td>{strengthText(m)}</td>
                    <td className="font-medium text-slate-900">Rs {m.price}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(m)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(m._id)}
                        >
                          Delete
                        </button>
                      </div>
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