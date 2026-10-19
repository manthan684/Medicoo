import { API_URL } from "../api";
import { useState, useEffect } from "react";
import axios from "axios";

const API = `${API_URL}/api/shops`;
const emptyForm = { name: "", ownerName: "", phone: "", address: "" };

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const fetchShops = async () => {
    try {
      const res = await axios.get(API);
      setShops(res.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return; // a second click while saving does nothing
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, form);
      } else {
        await axios.post(API, form);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchShops();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (shop) => {
    setEditingId(shop._id);
    setForm({
      name: shop.name,
      ownerName: shop.ownerName,
      phone: shop.phone,
      address: shop.address || "",
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" }); // show the form
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shop?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      if (id === editingId) handleCancel();
      fetchShops();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // the search box filters the list
  const visibleShops = shops.filter((s) =>
    `${s.name} ${s.ownerName} ${s.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="alert-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title">Shops</h1>
      <p className="page-sub">
        Manage shop details and keep your supply destinations up to date.
      </p>

      {/* form card */}
      <form onSubmit={handleSubmit} className="card mb-8">
        <h2 className="card-title">
          {editingId ? "Edit shop" : "Add a new shop"}
        </h2>
        <p className="card-sub mb-5">Shop and contact details</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="field-label">Shop name</label>
            <input
              className="input"
              name="name"
              placeholder="Example: Sharma Medical"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="field-label">Owner name</label>
            <input
              className="input"
              name="ownerName"
              placeholder="Example: Rakesh Sharma"
              value={form.ownerName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              className="input"
              name="phone"
              placeholder="91 and 10 digits"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="field-label">Address</label>
            <input
              className="input"
              name="address"
              placeholder="Example: Main Market"
              value={form.address}
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update shop" : "Add shop"}
          </button>
        </div>
      </form>

      {/* list card */}
      <div className="card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title">All shops ({visibleShops.length})</h2>
          <input
            className="input md:max-w-xs"
            placeholder="Search by name, owner or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {visibleShops.length === 0 ? (
          <p className="empty">
            {shops.length === 0 ? "No shops yet" : "No shop matches your search"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Owner</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleShops.map((shop) => (
                  <tr key={shop._id}>
                    <td className="font-medium text-slate-900">{shop.name}</td>
                    <td>{shop.ownerName}</td>
                    <td>{shop.phone}</td>
                    <td>{shop.address || "-"}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(shop)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(shop._id)}
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