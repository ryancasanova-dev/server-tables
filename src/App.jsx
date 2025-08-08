import React, { useEffect, useRef, useState } from "react";

// -------- Config --------
const GRID_SIZE = 90; // pixels per grid cell for snapping
const AREAS = ["Main Bar", "Bowling", "Dining", "Patio"];
const LS_KEY = "tableTracker_areas_v1"; // whole app state per area

const statusColors = {
  empty: "bg-gray-300",
  sat: "bg-yellow-400",
  food: "bg-blue-400",
  touched: "bg-green-400",
};

function makeInitialTables() {
  return [
    { id: 1, number: 1, server: "", status: "empty", col: 0, row: 0 },
    { id: 2, number: 2, server: "", status: "empty", col: 1, row: 0 },
    { id: 3, number: 3, server: "", status: "empty", col: 2, row: 0 },
    { id: 4, number: 4, server: "", status: "empty", col: 0, row: 1 },
    { id: 5, number: 5, server: "", status: "empty", col: 1, row: 1 },
    { id: 6, number: 6, server: "", status: "empty", col: 2, row: 1 },
  ];
}

const makeInitialState = () =>
  AREAS.reduce((acc, area) => {
    acc[area] = { tables: makeInitialTables(), bgDataUrl: null };
    return acc;
  }, {});

export default function TableGridApp() {
  const [areas, setAreas] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : makeInitialState();
  });
  const [area, setArea] = useState(AREAS[0]);
  const [editMode, setEditMode] = useState(false);

  // Service popup (server + status)
  const [editingTableId, setEditingTableId] = useState(null);
  const [tempServer, setTempServer] = useState("");

  // Layout popup (table number)
  const [numberEditId, setNumberEditId] = useState(null);
  const [tempNumber, setTempNumber] = useState("");

  // Drag state
  const floorRef = useRef(null);
  const dragRef = useRef(null); // { id, startCol, startRow, startX, startY }

  // Persist
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(areas));
  }, [areas]);

  // Helpers to read/write current area data
  const current = areas[area];
  const setCurrent = (updater) =>
    setAreas((prev) => ({ ...prev, [area]: updater(prev[area]) }));

  const cycleStatus = (id) => {
    setCurrent((a) => ({
      ...a,
      tables: a.tables.map((t) => {
        if (t.id === id) {
          const order = ["empty", "sat", "food", "touched"];
          const next = order[(order.indexOf(t.status) + 1) % order.length];
          return { ...t, status: next };
        }
        return t;
      }),
    }));
  };

  const openServiceEditor = (table) => {
    setEditingTableId(table.id);
    setTempServer(table.server);
  };

  const saveServer = () => {
    if (editingTableId == null) return;
    setCurrent((a) => ({
      ...a,
      tables: a.tables.map((t) =>
        t.id === editingTableId ? { ...t, server: tempServer } : t
      ),
    }));
    setEditingTableId(null);
    setTempServer("");
  };

  const openNumberEditor = (table) => {
    setNumberEditId(table.id);
    setTempNumber(String(table.number ?? ""));
  };

  const saveNumber = () => {
    if (numberEditId == null) return;
    const num = parseInt(tempNumber, 10);
    if (Number.isNaN(num)) {
      setNumberEditId(null);
      setTempNumber("");
      return;
    }
    setCurrent((a) => ({
      ...a,
      tables: a.tables.map((t) =>
        t.id === numberEditId ? { ...t, number: num } : t
      ),
    }));
    setNumberEditId(null);
    setTempNumber("");
  };

  const toggleEditMode = () => {
    setEditMode((v) => !v);
    setEditingTableId(null);
    setNumberEditId(null);
  };

  // ---------- Background image upload (saved per area) ----------
  const onBgUpload = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setCurrent((a) => ({ ...a, bgDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // ---------- Drag handlers (snap-to-grid) ----------
  const onDragStart = (e, table) => {
    if (!editMode) return;
    const client = e.touches ? e.touches[0] : e;
    dragRef.current = {
      id: table.id,
      startCol: table.col,
      startRow: table.row,
      startX: client.clientX,
      startY: client.clientY,
    };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
  };

  const onDragMove = (e) => {
    if (!dragRef.current) return;
    const client = e.touches ? e.touches[0] : e;
    if (e.cancelable) e.preventDefault(); // stop page scrolling on touch

    const dx = client.clientX - dragRef.current.startX;
    const dy = client.clientY - dragRef.current.startY;

    const dCol = Math.round(dx / GRID_SIZE);
    const dRow = Math.round(dy / GRID_SIZE);

    const newCol = Math.max(0, dragRef.current.startCol + dCol);
    const newRow = Math.max(0, dragRef.current.startRow + dRow);

    const id = dragRef.current.id;
    setCurrent((a) => ({
      ...a,
      tables: a.tables.map((t) =>
        t.id === id ? { ...t, col: newCol, row: newRow } : t
      ),
    }));
  };

  const onDragEnd = () => {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("touchend", onDragEnd);
  };

  // ---------- Rendering ----------
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Restaurant Table Tracker</h1>

        {/* Area Switcher (top right) */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm opacity-70">Area</label>
          <select
            className="border rounded px-2 py-1"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={toggleEditMode}
            className={`px-3 py-2 rounded text-white ${
              editMode ? "bg-purple-600" : "bg-gray-800"
            }`}
          >
            {editMode ? "Done Editing" : "Edit Layout"}
          </button>
        </div>
      </div>

      <div
        ref={floorRef}
        className="relative bg-white rounded-xl shadow overflow-hidden"
        style={{ width: "100%", height: 560 }}
      >
        {/* background image (per area) */}
        {current.bgDataUrl && (
          <img
            src={current.bgDataUrl}
            alt="floor"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* light grid overlay */}
        <GridBackground />

        {current.tables.map((table) => {
          const left = table.col * GRID_SIZE;
          const top = table.row * GRID_SIZE;
          const color = statusColors[table.status] || statusColors.empty;

          return (
            <div
              key={table.id}
              className={`absolute w-[80px] h-[80px] rounded-xl shadow flex flex-col items-center justify-center select-none ${color} ${
                editMode ? "cursor-move" : "cursor-pointer"
              }`}
              style={{ left, top }}
              onMouseDown={(e) => onDragStart(e, table)}
              onTouchStart={(e) => onDragStart(e, table)}
              onClick={(e) => {
                if (dragRef.current) return; // ignore click after dragging
                if (editMode) {
                  openNumberEditor(table);
                } else {
                  openServiceEditor(table);
                }
              }}
            >
              <div className="text-lg font-bold">{table.number}</div>
              <div className="text-xs opacity-90">
                {table.server || "No server"}
              </div>
            </div>
          );
        })}

        {/* Upload button appears only in edit mode */}
        {editMode && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl shadow px-3 py-2 flex items-center gap-2">
            <label className="text-sm">Background:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onBgUpload(e.target.files?.[0])}
            />
          </div>
        )}
      </div>

      {/* Service Editor Modal */}
      {editingTableId && !editMode && (
        <Modal onClose={() => setEditingTableId(null)}>
          <div className="mb-2 text-sm font-semibold">
            Table {current.tables.find((t) => t.id === editingTableId)?.number}
          </div>
          <input
            type="text"
            value={tempServer}
            onChange={(e) => setTempServer(e.target.value)}
            placeholder="Server name"
            className="border rounded p-2 w-full mb-3"
          />
          <button
            onClick={() => cycleStatus(editingTableId)}
            className={`w-full p-2 mb-3 rounded text-white ${
              statusColors[
                current.tables.find((t) => t.id === editingTableId)?.status ||
                  "empty"
              ]
            }`}
          >
            Cycle Status
          </button>
          <button
            onClick={saveServer}
            className="bg-green-600 text-white rounded w-full p-2"
          >
            Save
          </button>
        </Modal>
      )}

      {/* Number Editor Modal (Edit Layout) */}
      {numberEditId && editMode && (
        <Modal onClose={() => setNumberEditId(null)}>
          <div className="mb-2 text-sm font-semibold">Set Table Number</div>
          <input
            type="number"
            value={tempNumber}
            onChange={(e) => setTempNumber(e.target.value)}
            className="border rounded p-2 w-full mb-3"
          />
          <button
            onClick={saveNumber}
            className="bg-blue-600 text-white rounded w-full p-2"
          >
            Save Number
          </button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-4 w-72 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-black text-white rounded-full w-8 h-8"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function GridBackground() {
  const rows = Math.ceil(560 / GRID_SIZE);
  const cols = Math.ceil(1400 / GRID_SIZE); // wide enough for most phones
  const lines = [];
  for (let r = 0; r < rows; r++) {
    lines.push(
      <div
        key={`r${r}`}
        style={{ top: r * GRID_SIZE }}
        className="absolute left-0 right-0 h-px bg-gray-200"
      />
    );
  }
  for (let c = 0; c < cols; c++) {
    lines.push(
      <div
        key={`c${c}`}
        style={{ left: c * GRID_SIZE }}
        className="absolute top-0 bottom-0 w-px bg-gray-200"
      />
    );
  }
  return <div className="absolute inset-0 pointer-events-none">{lines}</div>;
}
