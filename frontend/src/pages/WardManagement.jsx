import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Building2,
  BedDouble,
  DoorOpen,
  Layers,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function WardManagement() {
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    wardName: "",
    wardType: "General",
    floor: "",
    capacity: "",
    description: "",
  });

  // Fetch wards from MongoDB via backend
  const fetchWards = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/wards");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch wards");
      }

      setWards(getList(result, "wards"));
    } catch (err) {
      setError(err.message || "Unable to load wards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const totalCapacity = wards.reduce(
    (sum, ward) => sum + Number(ward.capacity || 0),
    0
  );

  const filteredWards = wards.filter((ward) => {
    const matchesSearch = `${ward.wardName} ${ward.wardType} ${ward.floor} ${ward.wardId}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || ward.wardType === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingWard(null);
    setFormData({
      wardName: "",
      wardType: "General",
      floor: "",
      capacity: "",
      description: "",
    });
    setShowForm(true);
  };

  const openEditModal = (ward) => {
    setEditingWard(ward);
    setFormData({
      wardName: ward.wardName || "",
      wardType: ward.wardType || "General",
      floor: ward.floor !== undefined ? ward.floor : "",
      capacity: ward.capacity || "",
      description: ward.description || "",
    });
    setShowForm(true);
  };

  // Submit Ward Form (Add or Edit)
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.wardName.trim() || formData.floor === "" || !formData.capacity) {
      alert("Please fill in all required ward fields.");
      return;
    }

    try {
      const payload = {
        ...formData,
        wardName: formData.wardName.trim(),
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
      };

      const url = editingWard ? `/wards/${editingWard._id}` : "/wards";
      const method = editingWard ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save ward");
      }

      alert(editingWard ? "Ward updated successfully!" : "Ward created successfully!");
      setShowForm(false);
      setEditingWard(null);
      fetchWards();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete ward safely
  const deleteWard = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ward? This action is irreversible."
    );

    if (!confirmed) return;

    try {
      const response = await apiFetch(`/wards/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete ward");
      }

      alert("Ward deleted successfully!");
      fetchWards();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="ward-management">
      {/* SUMMARY CARDS */}
      <div className="ward-summary">
        <div className="ward-summary-card">
          <div className="ward-icon purple">
            <Building2 size={22} />
          </div>
          <p>Total Wards</p>
          <h2>{wards.length}</h2>
        </div>

        <div className="ward-summary-card">
          <div className="ward-icon blue">
            <DoorOpen size={22} />
          </div>
          <p>Total Bed Capacity</p>
          <h2>{totalCapacity}</h2>
        </div>

        <div className="ward-summary-card">
          <div className="ward-icon green">
            <BedDouble size={22} />
          </div>
          <p>Ward Categories</p>
          <h2>{new Set(wards.map((ward) => ward.wardType)).size}</h2>
        </div>

        <div className="ward-summary-card">
          <div className="ward-icon orange">
            <Layers size={22} />
          </div>
          <p>Total Floors</p>
          <h2>{new Set(wards.map((ward) => ward.floor)).size}</h2>
        </div>
      </div>

      {/* WARD LIST PANEL */}
      <div className="panel ward-panel">
        <div className="ward-toolbar">
          <div>
            <h3>Hospital Wards</h3>
            <p>Manage and monitor hospital wards, floors, and capacities</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="All">All Ward Types</option>
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Emergency">Emergency</option>
              <option value="Private">Private</option>
              <option value="Maternity">Maternity</option>
            </select>

            <button className="add-ward-btn" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add Ward</span>
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Search by ward name, ID, floor, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", margin: "14px 0" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Loading wards from database...
          </div>
        ) : filteredWards.length === 0 ? (
          <div className="empty-table-state">
            <Building2 size={36} />
            <p>No wards found</p>
            <span>Try adjusting your search query or add a new ward.</span>
          </div>
        ) : (
          <div className="ward-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="ward-table">
              <thead>
                <tr>
                  <th>WARD ID</th>
                  <th>WARD NAME</th>
                  <th>TYPE</th>
                  <th>FLOOR</th>
                  <th>CAPACITY</th>
                  <th>DESCRIPTION</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredWards.map((ward) => (
                  <tr key={ward._id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: "700" }}>
                        {ward.wardId || "—"}
                      </span>
                    </td>
                    <td>
                      <strong>{ward.wardName}</strong>
                    </td>
                    <td>
                      <span className="badge-status badge-available">
                        {ward.wardType}
                      </span>
                    </td>
                    <td>Floor {ward.floor}</td>
                    <td>
                      <strong>{ward.capacity}</strong> beds
                    </td>
                    <td>
                      <small style={{ color: "#64748b" }}>
                        {ward.description || "No description provided"}
                      </small>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          className="action-btn-pill action-btn-edit"
                          onClick={() => openEditModal(ward)}
                          title="Edit Ward"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="action-btn-pill action-btn-delete"
                          onClick={() => deleteWard(ward._id)}
                          title="Delete Ward"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
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

      {/* ADD / EDIT WARD MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingWard ? "Edit Hospital Ward" : "Add New Ward"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingWard(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Ward Name *</label>
                  <input
                    type="text"
                    name="wardName"
                    value={formData.wardName}
                    onChange={handleChange}
                    placeholder="e.g. General Ward A, ICU Unit 1"
                    required
                  />
                </div>

                <div className="modal-grid-2">
                  <div className="form-group">
                    <label>Ward Type *</label>
                    <select
                      name="wardType"
                      value={formData.wardType}
                      onChange={handleChange}
                    >
                      <option value="General">General</option>
                      <option value="ICU">ICU</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Private">Private</option>
                      <option value="Maternity">Maternity</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Floor Number *</label>
                    <input
                      type="number"
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      placeholder="e.g. 1"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bed Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="Maximum number of beds"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes about this ward..."
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingWard(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingWard ? "Update Ward" : "Create Ward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WardManagement;
