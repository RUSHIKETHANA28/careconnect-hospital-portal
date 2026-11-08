import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  BedDouble,
  CheckCircle2,
  Users,
  Brush,
  Wrench,
  X,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [wardFilter, setWardFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    bedNumber: "",
    room: "",
    bedType: "General",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [bedResponse, roomResponse, wardResponse] = await Promise.all([
        apiFetch("/beds"),
        apiFetch("/rooms"),
        apiFetch("/wards"),
      ]);

      const [bedResult, roomResult, wardResult] = await Promise.all([
        bedResponse.json(),
        roomResponse.json(),
        wardResponse.json(),
      ]);

      if (!bedResponse.ok) throw new Error(bedResult.message || "Failed to fetch beds");
      if (!roomResponse.ok) throw new Error(roomResult.message || "Failed to fetch rooms");
      if (!wardResponse.ok) throw new Error(wardResult.message || "Failed to fetch wards");

      setBeds(getList(bedResult, "beds"));
      setRooms(getList(roomResult, "rooms"));
      setWards(getList(wardResult, "wards"));
    } catch (err) {
      setError(err.message || "Failed to load beds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format bed presentation with room and ward info
  const displayBeds = beds.map((bed) => {
    const roomId = typeof bed.room === "object" ? bed.room?._id : bed.room;
    const room = rooms.find((r) => String(r._id) === String(roomId));

    const roomNumber = typeof bed.room === "object" ? bed.room?.roomNumber : room?.roomNumber;
    const wardObj = typeof bed.ward === "object" ? bed.ward : room?.ward;

    let wardName = "Unknown Ward";
    let wardId = null;
    if (typeof wardObj === "object" && wardObj) {
      wardName = wardObj.wardName || "Unknown Ward";
      wardId = wardObj._id;
    } else if (wardObj) {
      wardId = wardObj;
      const foundWard = wards.find((w) => String(w._id) === String(wardObj));
      if (foundWard) wardName = foundWard.wardName;
    }

    return {
      ...bed,
      displayRoom: roomNumber ? `Room ${roomNumber}` : "Room —",
      displayWard: wardName,
      wardId,
    };
  });

  const filteredBeds = displayBeds.filter((bed) => {
    const matchesSearch = `${bed.bedNumber} ${bed.bedId} ${bed.displayWard} ${bed.displayRoom} ${bed.bedType}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || bed.status === statusFilter;
    const matchesWard = wardFilter === "All" || String(bed.wardId) === String(wardFilter);

    return matchesSearch && matchesStatus && matchesWard;
  });

  const counts = [
    { label: "Total Beds", value: beds.length, icon: BedDouble, color: "blue" },
    { label: "Available Beds", value: beds.filter((b) => b.status === "Available").length, icon: CheckCircle2, color: "green" },
    { label: "Occupied Beds", value: beds.filter((b) => b.status === "Occupied").length, icon: Users, color: "purple" },
    { label: "Cleaning Beds", value: beds.filter((b) => b.status === "Cleaning").length, icon: Brush, color: "orange" },
    { label: "Maintenance Beds", value: beds.filter((b) => b.status === "Maintenance").length, icon: Wrench, color: "red" },
  ];

  const openAddModal = () => {
    setEditingBed(null);
    setFormData({
      bedNumber: "",
      room: rooms[0]?._id || "",
      bedType: "General",
    });
    setShowForm(true);
  };

  const openEditModal = (bed) => {
    setEditingBed(bed);
    const roomId = typeof bed.room === "object" ? bed.room?._id : bed.room;
    setFormData({
      bedNumber: bed.bedNumber || "",
      room: roomId || "",
      bedType: bed.bedType || "General",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or Edit Bed
  const handleSubmit = async (event) => {
    event.preventDefault();

    const selectedRoom = rooms.find((r) => String(r._id) === String(formData.room));
    if (!selectedRoom) {
      alert("Please select a valid room.");
      return;
    }

    const wardId = typeof selectedRoom.ward === "object" ? selectedRoom.ward?._id : selectedRoom.ward;

    try {
      const payload = {
        bedNumber: formData.bedNumber.trim(),
        room: formData.room,
        ward: wardId,
        bedType: formData.bedType,
      };

      const url = editingBed ? `/beds/${editingBed._id}` : "/beds";
      const method = editingBed ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save bed");
      }

      alert(editingBed ? "Bed updated successfully!" : "Bed created successfully!");
      setShowForm(false);
      setEditingBed(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Bed Status (e.g. Complete Cleaning, Set Maintenance, Return to Available)
  const updateBedStatus = async (id, newStatus) => {
    try {
      const response = await apiFetch(`/beds/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update bed status");
      }

      fetchData();
    } catch (err) {
      alert(err.message);
      fetchData();
    }
  };

  // Delete Bed safely
  const deleteBed = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this bed?");
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/beds/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete bed");
      }

      alert("Bed deleted successfully!");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bed-management">
      {/* SUMMARY CARDS */}
      <div className="bed-summary">
        {counts.map((item) => {
          const Icon = item.icon;
          return (
            <div className="bed-summary-card" key={item.label}>
              <div className="bed-summary-info">
                <span>{item.label}</span>
                <h2>{item.value}</h2>
              </div>
              <div className={`bed-summary-icon ${item.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* BED LIST PANEL */}
      <div className="panel bed-panel">
        <div className="bed-toolbar">
          <div>
            <h3>Hospital Beds</h3>
            <p>Monitor real-time bed occupancy, cleaning workflow, and maintenance</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="All">All Wards</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.wardName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <button className="add-bed-btn" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add Bed</span>
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Search by bed number, ID, ward, room, or type..."
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
            Loading beds from database...
          </div>
        ) : filteredBeds.length === 0 ? (
          <div className="empty-table-state">
            <BedDouble size={36} />
            <p>No beds match your filter</p>
            <span>Try adjusting search parameters or add a new bed.</span>
          </div>
        ) : (
          <div className="bed-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="bed-table">
              <thead>
                <tr>
                  <th>BED ID</th>
                  <th>BED NUMBER</th>
                  <th>WARD</th>
                  <th>ROOM</th>
                  <th>BED TYPE</th>
                  <th>STATUS</th>
                  <th>CLEANING / ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeds.map((bed) => (
                  <tr key={bed._id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: "700" }}>
                        {bed.bedId || "—"}
                      </span>
                    </td>
                    <td>
                      <strong>Bed {bed.bedNumber}</strong>
                    </td>
                    <td>{bed.displayWard}</td>
                    <td>{bed.displayRoom}</td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#475569" }}>
                        {bed.bedType || "General"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          bed.status === "Available"
                            ? "badge-available"
                            : bed.status === "Occupied"
                            ? "badge-occupied"
                            : bed.status === "Cleaning"
                            ? "badge-cleaning"
                            : "badge-maintenance"
                        }`}
                      >
                        {bed.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        {/* Quick Bed Status Action Buttons */}
                        {bed.status === "Cleaning" && (
                          <button
                            className="action-btn-pill action-btn-clean"
                            onClick={() => updateBedStatus(bed._id, "Available")}
                            title="Mark Cleaning Completed -> Ready for Admission"
                          >
                            <Sparkles size={14} />
                            <span>Complete Cleaning</span>
                          </button>
                        )}

                        {bed.status === "Maintenance" && (
                          <button
                            className="action-btn-pill action-btn-clean"
                            onClick={() => updateBedStatus(bed._id, "Available")}
                            title="Maintenance Complete -> Ready for Admission"
                          >
                            <CheckCircle2 size={14} />
                            <span>Complete Maintenance</span>
                          </button>
                        )}

                        {bed.status === "Available" && (
                          <button
                            className="action-btn-pill action-btn-view"
                            onClick={() => updateBedStatus(bed._id, "Maintenance")}
                            title="Flag for Maintenance"
                          >
                            <Wrench size={13} />
                            <span>Maintenance</span>
                          </button>
                        )}

                        <button
                          className="action-btn-pill action-btn-edit"
                          onClick={() => openEditModal(bed)}
                          title="Edit Bed"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          className="action-btn-pill action-btn-delete"
                          onClick={() => deleteBed(bed._id)}
                          title="Delete Bed"
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

      {/* ADD / EDIT BED MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingBed ? "Edit Hospital Bed" : "Add New Bed"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingBed(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Bed Number / Identifier *</label>
                  <input
                    type="text"
                    name="bedNumber"
                    value={formData.bedNumber}
                    onChange={handleChange}
                    placeholder="e.g. B-101, ICU-01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Assigned Room *</label>
                  <select
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Room</option>
                    {rooms.map((room) => {
                      const wardName =
                        typeof room.ward === "object"
                          ? room.ward?.wardName
                          : wards.find((w) => w._id === room.ward)?.wardName;
                      return (
                        <option key={room._id} value={room._id}>
                          Room {room.roomNumber} ({wardName || "Ward"} - Capacity: {room.capacity})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label>Bed Type *</label>
                  <select
                    name="bedType"
                    value={formData.bedType}
                    onChange={handleChange}
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBed(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBed ? "Update Bed" : "Create Bed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BedManagement;
