import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  DoorOpen,
  BedDouble,
  Building2,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    roomNumber: "",
    ward: "",
    floor: "",
    capacity: "",
  });

  // Fetch rooms, wards and beds from MongoDB via backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [roomResponse, wardResponse, bedResponse] = await Promise.all([
        apiFetch("/rooms"),
        apiFetch("/wards"),
        apiFetch("/beds"),
      ]);

      const [roomResult, wardResult, bedResult] = await Promise.all([
        roomResponse.json(),
        wardResponse.json(),
        bedResponse.json(),
      ]);

      if (!roomResponse.ok) {
        throw new Error(roomResult.message || "Failed to fetch rooms");
      }
      if (!wardResponse.ok) {
        throw new Error(wardResult.message || "Failed to fetch wards");
      }
      if (!bedResponse.ok) {
        throw new Error(bedResult.message || "Failed to fetch beds");
      }

      setRooms(getList(roomResult, "rooms"));
      setWards(getList(wardResult, "wards"));
      setBeds(getList(bedResult, "beds"));
    } catch (err) {
      setError(err.message || "Failed to load room data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute room live status and occupancy from actual bed records
  const roomDetails = rooms.map((room) => {
    const roomBeds = beds.filter((bed) => {
      const bedRoomId = typeof bed.room === "object" ? bed.room?._id : bed.room;
      return String(bedRoomId) === String(room._id);
    });

    const occupiedCount = roomBeds.filter((b) => b.status === "Occupied").length;
    const cleaningCount = roomBeds.filter((b) => b.status === "Cleaning").length;
    const maintenanceCount = roomBeds.filter((b) => b.status === "Maintenance").length;

    let status = "Available";
    if (maintenanceCount > 0) status = "Maintenance";
    else if (cleaningCount > 0) status = "Cleaning";
    else if (roomBeds.length > 0 && occupiedCount === roomBeds.length) {
      status = "Occupied";
    }

    const wardName =
      typeof room.ward === "object"
        ? room.ward?.wardName
        : wards.find((w) => w._id === room.ward)?.wardName;

    return {
      ...room,
      wardName: wardName || "Unknown Ward",
      bedCount: roomBeds.length,
      occupiedCount,
      status,
    };
  });

  const filteredRooms = roomDetails.filter((room) => {
    const matchesSearch = `${room.roomNumber} ${room.wardName} ${room.floor} ${room.roomId}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const wardId = typeof room.ward === "object" ? room.ward?._id : room.ward;
    const matchesWard = wardFilter === "All" || String(wardId) === String(wardFilter);

    return matchesSearch && matchesWard;
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: "",
      ward: wards[0]?._id || "",
      floor: wards[0]?.floor !== undefined ? String(wards[0].floor) : "",
      capacity: "2",
    });
    setShowForm(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    const wardId = typeof room.ward === "object" ? room.ward?._id : room.ward;
    setFormData({
      roomNumber: room.roomNumber || "",
      ward: wardId || "",
      floor: room.floor !== undefined ? String(room.floor) : "",
      capacity: room.capacity !== undefined ? String(room.capacity) : "2",
    });
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => {
      const updated = { ...previous, [name]: value };
      if (name === "ward") {
        const foundWard = wards.find((w) => w._id === value);
        if (foundWard && foundWard.floor !== undefined) {
          updated.floor = String(foundWard.floor);
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.roomNumber.trim() || !formData.ward || formData.floor === "" || !formData.capacity) {
      alert("Please fill in all required room details.");
      return;
    }

    try {
      const payload = {
        ...formData,
        roomNumber: formData.roomNumber.trim(),
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
      };

      const url = editingRoom ? `/rooms/${editingRoom._id}` : "/rooms";
      const method = editingRoom ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save room");
      }

      alert(editingRoom ? "Room updated successfully!" : "Room created successfully!");
      setShowForm(false);
      setEditingRoom(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteRoom = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this room? Beds in this room must be removed first."
    );

    if (!confirmed) return;

    try {
      const response = await apiFetch(`/rooms/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete room");
      }

      alert("Room deleted successfully!");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="room-management">
      {/* SUMMARY STATS */}
      <div className="room-summary">
        <div className="room-summary-card">
          <div className="room-icon purple">
            <DoorOpen size={22} />
          </div>
          <p>Total Rooms</p>
          <h2>{rooms.length}</h2>
        </div>

        <div className="room-summary-card">
          <div className="room-icon blue">
            <Building2 size={22} />
          </div>
          <p>Assigned Wards</p>
          <h2>{new Set(rooms.map((r) => (typeof r.ward === "object" ? r.ward?._id : r.ward))).size}</h2>
        </div>

        <div className="room-summary-card">
          <div className="room-icon green">
            <BedDouble size={22} />
          </div>
          <p>Beds Configured</p>
          <h2>{beds.length}</h2>
        </div>

        <div className="room-summary-card">
          <div className="room-icon orange">
            <DoorOpen size={22} />
          </div>
          <p>Total Capacity</p>
          <h2>{rooms.reduce((s, r) => s + Number(r.capacity || 0), 0)}</h2>
        </div>
      </div>

      {/* ROOM LIST PANEL */}
      <div className="panel room-panel">
        <div className="room-toolbar">
          <div>
            <h3>Hospital Rooms</h3>
            <p>Manage and monitor hospital rooms by ward and capacity</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="All">All Wards</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.wardName} ({ward.wardType})
                </option>
              ))}
            </select>

            <button className="add-room-btn" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add Room</span>
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Search by room number, ward, floor, or room ID..."
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
            Loading rooms from database...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-table-state">
            <DoorOpen size={36} />
            <p>No rooms found</p>
            <span>Try adjusting your filter or add a new room.</span>
          </div>
        ) : (
          <div className="room-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="room-table">
              <thead>
                <tr>
                  <th>ROOM ID</th>
                  <th>ROOM NUMBER</th>
                  <th>WARD</th>
                  <th>FLOOR</th>
                  <th>BED OCCUPANCY</th>
                  <th>ROOM STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room._id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: "700" }}>
                        {room.roomId || "—"}
                      </span>
                    </td>
                    <td>
                      <strong>Room {room.roomNumber}</strong>
                    </td>
                    <td>{room.wardName}</td>
                    <td>Floor {room.floor}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>{room.bedCount} / {room.capacity}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          ({room.occupiedCount} occupied)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          room.status === "Available"
                            ? "badge-available"
                            : room.status === "Occupied"
                            ? "badge-occupied"
                            : room.status === "Cleaning"
                            ? "badge-cleaning"
                            : "badge-maintenance"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          className="action-btn-pill action-btn-edit"
                          onClick={() => openEditModal(room)}
                          title="Edit Room"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="action-btn-pill action-btn-delete"
                          onClick={() => deleteRoom(room._id)}
                          title="Delete Room"
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

      {/* ADD / EDIT ROOM MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingRoom ? "Edit Room" : "Add New Room"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingRoom(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Room Number *</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101, ICU-1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Assigned Ward *</label>
                  <select
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Ward</option>
                    {wards.map((ward) => (
                      <option key={ward._id} value={ward._id}>
                        {ward.wardName} ({ward.wardType} - Floor {ward.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-grid-2">
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

                  <div className="form-group">
                    <label>Bed Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      placeholder="e.g. 2, 4"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRoom(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRoom ? "Update Room" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomManagement;
