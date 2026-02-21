/**
 * Hotel Room Reservation System — React Frontend
 * ================================================
 * 
 * Components:
 *   App              — root, holds all state, talks to backend API
 *   ControlPanel     — input + Book / Reset / Random buttons
 *   StatsBar         — live occupancy stats
 *   HotelGrid        — visual grid of all 10 floors
 *   FloorRow         — single floor with room cells
 *   RoomCell         — individual room square with status color
 *   Legend           — color key
 *   BookingResult    — shows last booking result (rooms + travel time)
 * 
 * Color coding:
 *   ⬜ White/light  — available
 *   🟠 Orange       — randomly occupied (existing guest)
 *   🟢 Green        — newly booked (last booking action)
 *   🔴 Red          — previously booked (earlier booking actions)
 */

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────
const API = "http://localhost:4000/api";

// ─────────────────────────────────────────────────────────────────
// UTILITY HOOKS
// ─────────────────────────────────────────────────────────────────
function useHotel() {
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ total: 97, booked: 0, available: 97 });
  const [lastBooking, setLastBooking] = useState(null); // { bookedRooms, travelTime }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = useCallback((data) => {
    setRooms(data.rooms || []);
    setStats(data.stats || {});
  }, []);

  // Fetch initial state
  useEffect(() => {
    fetch(`${API}/rooms`)
      .then(r => r.json())
      .then(data => handleResponse(data))
      .catch(() => setError("Cannot connect to server. Is the backend running on port 4000?"));
  }, [handleResponse]);

  const bookRooms = useCallback(async (count) => {
    setLoading(true);
    setError(null);
    setLastBooking(null);
    try {
      const res = await fetch(`${API}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        handleResponse(data);
        setLastBooking({ bookedRooms: data.bookedRooms, travelTime: data.travelTime });
      }
    } catch {
      setError("Network error. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [handleResponse]);

  const randomOccupancy = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastBooking(null);
    try {
      const res = await fetch(`${API}/random`, { method: "POST" });
      const data = await res.json();
      handleResponse(data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [handleResponse]);

  const resetAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastBooking(null);
    try {
      const res = await fetch(`${API}/reset`, { method: "POST" });
      const data = await res.json();
      handleResponse(data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [handleResponse]);

  return { rooms, stats, lastBooking, loading, error, bookRooms, randomOccupancy, resetAll };
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

/** Room color logic */
function getRoomStyle(room) {
  if (room.newlyBooked) return { bg: "#22c55e", text: "#fff", border: "#16a34a", label: "New" };
  if (room.randomlyOccupied) return { bg: "#f97316", text: "#fff", border: "#ea580c", label: "Occ" };
  if (room.booked) return { bg: "#ef4444", text: "#fff", border: "#dc2626", label: "Bkd" };
  return { bg: "#f0fdf4", text: "#374151", border: "#d1fae5", label: "" };
}

function RoomCell({ room, isSmall }) {
  const style = getRoomStyle(room);
  const size = isSmall ? 36 : 44;

  return (
    <div
      title={`Room ${room.id} | Floor ${room.floor} | Position ${room.position} | ${room.booked ? "Booked" : "Available"}`}
      style={{
        width: size,
        height: size,
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        transition: "all 0.25s ease",
        boxShadow: room.newlyBooked ? "0 0 8px #22c55e88" : "none",
        transform: room.newlyBooked ? "scale(1.08)" : "scale(1)",
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: style.text, lineHeight: 1 }}>
        {room.id}
      </span>
      {style.label && (
        <span style={{ fontSize: 7, color: style.text, marginTop: 1, opacity: 0.85 }}>
          {style.label}
        </span>
      )}
    </div>
  );
}

function FloorRow({ floor, rooms, isSmall }) {
  const floorRooms = rooms
    .filter(r => r.floor === floor)
    .sort((a, b) => a.position - b.position);

  const available = floorRooms.filter(r => !r.booked).length;
  const total = floorRooms.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      {/* Floor label */}
      <div style={{
        width: 64,
        textAlign: "right",
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 700,
        color: "#4b5563",
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        {floor === 10 ? "F10 (Top)" : `F${floor}`}
        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 400 }}>
          {available}/{total} free
        </div>
      </div>

      {/* Stairs indicator */}
      <div style={{
        width: 20,
        height: isSmall ? 36 : 44,
        background: "linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, color: "#fff", writingMode: "vertical-rl", transform: "rotate(180deg)", fontWeight: 700 }}>
          🪜
        </span>
      </div>

      {/* Room cells */}
      <div style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
        {floorRooms.map(room => (
          <RoomCell key={room.id} room={room} isSmall={isSmall} />
        ))}
      </div>
    </div>
  );
}

function HotelGrid({ rooms }) {
  const [isSmall, setIsSmall] = useState(window.innerWidth < 700);

  useEffect(() => {
    const handler = () => setIsSmall(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Render floor 10 first (top), then 9 down to 1
  const floorOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "20px 24px",
      boxShadow: "0 2px 16px #0000000a",
      border: "1px solid #e5e7eb",
      overflowX: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🏨</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Hotel Floor Plan
        </h2>
        <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>
          Stairs/Lift on LEFT side
        </span>
      </div>

      <div style={{ minWidth: isSmall ? 380 : "auto" }}>
        {floorOrder.map(floor => (
          <FloorRow key={floor} floor={floor} rooms={rooms} isSmall={isSmall} />
        ))}
      </div>
    </div>
  );
}

function StatsBar({ stats }) {
  const pct = stats.total ? Math.round((stats.booked / stats.total) * 100) : 0;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12,
      marginBottom: 16,
    }}>
      {[
        { label: "Total Rooms", value: stats.total, color: "#6366f1" },
        { label: "Booked", value: stats.booked, color: "#ef4444" },
        { label: "Available", value: stats.available, color: "#22c55e" },
      ].map(s => (
        <div key={s.label} style={{
          background: "#fff",
          border: `2px solid ${s.color}22`,
          borderRadius: 12,
          padding: "12px 16px",
          textAlign: "center",
          boxShadow: "0 1px 4px #0000000a",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: 600 }}>
            {s.label}
          </div>
        </div>
      ))}

      {/* Occupancy bar — full width */}
      <div style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Occupancy</span>
          <span style={{ fontSize: 11, color: "#374151", fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8 }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #22c55e, #ef4444)",
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: "#f0fdf4", border: "#d1fae5", label: "Available" },
    { color: "#22c55e", border: "#16a34a", label: "Newly Booked" },
    { color: "#ef4444", border: "#dc2626", label: "Previously Booked" },
    { color: "#f97316", border: "#ea580c", label: "Randomly Occupied" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      {items.map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 16, height: 16, borderRadius: 4,
            background: item.color, border: `2px solid ${item.border}`,
          }} />
          <span style={{ fontSize: 12, color: "#4b5563" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function BookingResult({ lastBooking, rooms }) {
  if (!lastBooking) return null;

  const bookedDetails = lastBooking.bookedRooms
    .map(id => rooms.find(r => r.id === id))
    .filter(Boolean)
    .sort((a, b) => a.floor !== b.floor ? a.floor - b.floor : a.position - b.position);

  return (
    <div style={{
      background: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
      border: "2px solid #22c55e",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#15803d" }}>
          Booking Confirmed — {lastBooking.bookedRooms.length} room(s)
        </h3>
        <span style={{
          marginLeft: "auto", background: "#15803d", color: "#fff",
          borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700
        }}>
          ⏱ {lastBooking.travelTime} min travel
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {bookedDetails.map(room => (
          <div key={room.id} style={{
            background: "#fff",
            border: "2px solid #22c55e",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 700,
            color: "#15803d",
          }}>
            Room {room.id}
            <span style={{ fontSize: 10, fontWeight: 400, color: "#6b7280", display: "block" }}>
              Floor {room.floor}, Pos {room.position}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#166534" }}>
        <strong>How rooms were selected:</strong>{" "}
        {bookedDetails[0]?.floor === bookedDetails[bookedDetails.length - 1]?.floor
          ? `All rooms found on Floor ${bookedDetails[0]?.floor} — single-floor booking minimizes travel time.`
          : `Rooms span ${[...new Set(bookedDetails.map(r => r.floor))].length} floors. Optimal cross-floor selection minimizes combined vertical + horizontal travel.`
        }
        {" "}Total travel from first to last room: <strong>{lastBooking.travelTime} minutes</strong>.
      </div>
    </div>
  );
}

function ControlPanel({ onBook, onRandom, onReset, loading }) {
  const [count, setCount] = useState("");
  const [inputError, setInputError] = useState("");

  const handleBook = () => {
    const n = parseInt(count, 10);
    if (!n || n < 1 || n > 5) {
      setInputError("Enter a number between 1 and 5");
      return;
    }
    setInputError("");
    onBook(n);
    setCount("")
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "20px 24px",
      boxShadow: "0 2px 16px #0000000a",
      border: "1px solid #e5e7eb",
      marginBottom: 16,
    }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
        🛎️ Reservation Controls
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start" }}>
        {/* Room count input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
            No. of Rooms (1–5)
          </label>
          <input
            type="number"
            min={1}
            max={5}
            value={count}
            onChange={e => { setCount(e.target.value); setInputError(""); }}
            onKeyDown={e => e.key === "Enter" && handleBook()}
            placeholder="e.g. 3"
            style={{
              width: 120,
              padding: "9px 12px",
              borderRadius: 8,
              border: `2px solid ${inputError ? "#ef4444" : "#d1d5db"}`,
              fontSize: 14,
              fontWeight: 600,
              outline: "none",
              color: "#111827",
            }}
          />
          {inputError && (
            <span style={{ fontSize: 11, color: "#ef4444" }}>{inputError}</span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", paddingBottom: inputError ? 20 : 0 }}>
          <Btn
            label="📋 Book Rooms"
            onClick={handleBook}
            disabled={loading}
            primary
          />
          <Btn
            label="🎲 Random Occupancy"
            onClick={onRandom}
            disabled={loading}
            color="#f97316"
          />
          <Btn
            label="🔄 Reset All"
            onClick={onReset}
            disabled={loading}
            color="#6b7280"
          />
        </div>
      </div>

      {loading && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#6366f1", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
          Processing…
        </div>
      )}
    </div>
  );
}

function Btn({ label, onClick, disabled, primary, color }) {
  const bg = primary ? "#6366f1" : (color || "#374151");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#e5e7eb" : bg,
        color: disabled ? "#9ca3af" : "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 18px",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 0.15s",
        opacity: disabled ? 0.7 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function AlgorithmExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "#fafafa",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left", padding: "12px 16px",
          background: "none", border: "none", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
          📐 How the Booking Algorithm Works
        </span>
        <span style={{ color: "#9ca3af" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: "#4b5563", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 8px" }}>
            <strong>Travel time formula:</strong>
          </p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
            <li><strong>Same floor:</strong> |posA − posB| minutes (horizontal)</li>
            <li><strong>Different floors:</strong> (posA − 1) + |floorA − floorB| × 2 + (posB − 1) minutes
              <br /><em>(walk to stairs + climb floors + walk from stairs)</em>
            </li>
          </ul>
          <p style={{ margin: "0 0 8px" }}><strong>Selection algorithm (2 steps):</strong></p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              <strong>Step 1 — Single floor:</strong> For each floor, find the N available rooms
              with minimum total travel time (sliding-window on sorted rooms). Pick the floor
              with globally minimum travel time.
            </li>
            <li style={{ marginTop: 6 }}>
              <strong>Step 2 — Cross-floor fallback:</strong> Expand a window of consecutive
              floors (2, 3, 4…) until enough available rooms exist. Within each window,
              use the sliding-window on rooms sorted by (floor, position) to find the
              N-room subset with minimum combined vertical + horizontal travel time.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const { rooms, stats, lastBooking, loading, error, bookRooms, randomOccupancy, resetAll } = useHotel();

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)",
      padding: "24px 16px",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus { border-color: #6366f1 !important; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 900, margin: "0 0 4px",
            background: "linear-gradient(90deg, #6366f1, #22c55e)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            🏨 Hotel Room Reservation System
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            97 rooms · 10 floors · Optimal allocation algorithm
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "2px solid #fca5a5",
            borderRadius: 10, padding: "10px 16px", marginBottom: 16,
            fontSize: 13, color: "#dc2626", display: "flex", gap: 8,
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Controls */}
        <ControlPanel onBook={bookRooms} onRandom={randomOccupancy} onReset={resetAll} loading={loading} />

        {/* Last booking result */}
        <BookingResult lastBooking={lastBooking} rooms={rooms} />

        {/* Algorithm explainer */}
        {/* <AlgorithmExplainer /> */}

        {/* Legend */}
        <Legend />

        {/* Hotel grid */}
        <HotelGrid rooms={rooms} />
      </div>
    </div>
  );
}
