import { useState, useEffect, useCallback, useRef } from "react";

// ─── Persistent Storage Helpers ───────────────────────────────────────────────
const STORAGE_KEYS = { keys: "klms:keys", borrowing: "klms:borrowing", audit: "klms:audit", users: "klms:users" };

async function loadData(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}
async function saveData(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ["Checked In", "Checked Out", "Lost", "Deactivated"];
const LOCATIONS = ["Stone Mountain Hub", "Aux Lot – Rock Chapel", "Aux Lot – Jabco", "With Customer", "Off-site Vended"];
const ROLES = ["Admin", "Librarian", "Viewer"];

const STATUS_COLOR = {
  "Checked In": "#22c55e",
  "Checked Out": "#f59e0b",
  "Lost": "#ef4444",
  "Deactivated": "#94a3b8",
};

function uuid() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }
function now() { return new Date().toISOString(); }
function fmtDT(iso) { if (!iso) return "—"; const d = new Date(iso); return d.toLocaleString(); }
function daysSince(iso) { if (!iso) return 0; return Math.floor((Date.now() - new Date(iso)) / 86400000); }
function csvEscape(v) { if (v == null) return ""; const s = String(v); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; }

// ─── Seed Data ────────────────────────────────────────────────────────────────
function seedKeys() {
  return [
    { MvaID: "10000001", status: "Checked In", location: "Stone Mountain Hub", numKeys: 1, notes: "", dateAdded: now(), addedBy: "Admin", lastUpdated: now(), lastUpdatedBy: "Admin", lastBorrower: "" },
    { MvaID: "10000002", status: "Checked Out", location: "Stone Mountain Hub", numKeys: 1, notes: "Spare key", dateAdded: now(), addedBy: "Admin", lastUpdated: now(), lastUpdatedBy: "Admin", lastBorrower: "Jane Smith" },
    { MvaID: "10000003", status: "Checked In", location: "Aux Lot – Rock Chapel", numKeys: 2, notes: "", dateAdded: now(), addedBy: "Admin", lastUpdated: now(), lastUpdatedBy: "Admin", lastBorrower: "" },
    { MvaID: "10000004", status: "Lost", location: "Aux Lot – Jabco", numKeys: 1, notes: "Reported missing", dateAdded: now(), addedBy: "Admin", lastUpdated: now(), lastUpdatedBy: "Admin", lastBorrower: "Bob Lee" },
    { MvaID: "10000005", status: "Checked In", location: "Off-site Vended", numKeys: 3, notes: "", dateAdded: now(), addedBy: "Admin", lastUpdated: now(), lastUpdatedBy: "Admin", lastBorrower: "" },
  ];
}
function seedBorrowing() {
  const ts = new Date(Date.now() - 86400000 * 2).toISOString();
  return [
    { id: uuid(), MvaID: "10000002", action: "Checked Out", librarianName: "Alice", borrowerName: "Jane Smith", eventDT: ts },
  ];
}
function seedAudit() {
  return [
    { id: uuid(), MvaID: "10000001", change: "Key added to inventory", user: "Admin", dt: now() },
    { id: uuid(), MvaID: "10000002", change: "Checked Out to Jane Smith", user: "Alice", dt: now() },
  ];
}
function seedUsers() {
  return [
    { id: "u1", name: "Admin", role: "Admin" },
    { id: "u2", name: "Alice", role: "Librarian" },
    { id: "u3", name: "Bob", role: "Viewer" },
  ];
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [keys, setKeys] = useState([]);
  const [borrowing, setBorrowing] = useState([]);
  const [audit, setAudit] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedKey, setSelectedKey] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load data
  useEffect(() => {
    (async () => {
      const k = await loadData(STORAGE_KEYS.keys);
      const b = await loadData(STORAGE_KEYS.borrowing);
      const a = await loadData(STORAGE_KEYS.audit);
      const u = await loadData(STORAGE_KEYS.users);
      setKeys(k || seedKeys());
      setBorrowing(b || seedBorrowing());
      setAudit(a || seedAudit());
      setUsers(u || seedUsers());
      setCurrentUser((u || seedUsers())[0]);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.keys, keys); }, [keys, loaded]);
  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.borrowing, borrowing); }, [borrowing, loaded]);
  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.audit, audit); }, [audit, loaded]);
  useEffect(() => { if (loaded) saveData(STORAGE_KEYS.users, users); }, [users, loaded]);

  const notify = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const addAudit = useCallback((MvaID, change, user) => {
    setAudit(a => [...a, { id: uuid(), MvaID, change, user, dt: now() }]);
  }, []);

  // ── Key Operations ─────────────────────────────────────────────────────────
  const addKey = useCallback((data) => {
    if (!data.MvaID || !/^\d{8}$/.test(data.MvaID)) return notify("MvaID must be 8 digits", "error");
    if (keys.find(k => k.MvaID === data.MvaID)) return notify("Duplicate MvaID", "error");
    const newKey = {
      ...data,
      status: "Checked In",
      dateAdded: now(),
      addedBy: currentUser.name,
      lastUpdated: now(),
      lastUpdatedBy: currentUser.name,
      lastBorrower: "",
    };
    setKeys(k => [...k, newKey]);
    addAudit(data.MvaID, "Key added to inventory", currentUser.name);
    notify("Key added successfully");
  }, [keys, currentUser, addAudit, notify]);

  const removeKey = useCallback((MvaID) => {
    const ts = now();
    setKeys(k => k.map(key => key.MvaID === MvaID
      ? { ...key, status: "Deactivated", lastUpdated: ts, lastUpdatedBy: currentUser.name }
      : key));
    addAudit(MvaID, `Key deleted — status set to Deactivated by ${currentUser.name} (${currentUser.role})`, currentUser.name);
    notify("Key deleted and logged in audit history");
  }, [currentUser, addAudit, notify]);

  const checkOut = useCallback((MvaID, borrowerName, librarianName) => {
    const key = keys.find(k => k.MvaID === MvaID);
    if (!key || key.status !== "Checked In") return notify("Key is not available for checkout", "error");
    // Count existing checkouts for borrower (excluding With Customer)
    const borrowerCount = keys.filter(k => k.status === "Checked Out" && k.lastBorrower === borrowerName && k.location !== "With Customer").length;
    if (borrowerCount >= 2) return notify(`${borrowerName} already has 2 keys checked out`, "error");

    setKeys(k => k.map(key => key.MvaID === MvaID
      ? { ...key, status: "Checked Out", lastUpdated: now(), lastUpdatedBy: librarianName, lastBorrower: borrowerName }
      : key));
    const record = { id: uuid(), MvaID, action: "Checked Out", librarianName, borrowerName, eventDT: now() };
    setBorrowing(b => [...b, record]);
    addAudit(MvaID, `Checked Out to ${borrowerName} by ${librarianName}`, librarianName);
    notify(`Key ${MvaID} checked out to ${borrowerName}`);
  }, [keys, addAudit, notify]);

  const checkIn = useCallback((MvaID, librarianName, borrowerName) => {
    const key = keys.find(k => k.MvaID === MvaID);
    if (!key || (key.status !== "Checked Out" && key.status !== "Lost")) return notify("Key must be Checked Out or Lost to check in", "error");

    const wasLost = key.status === "Lost";
    setKeys(k => k.map(key => key.MvaID === MvaID
      ? { ...key, status: "Checked In", lastUpdated: now(), lastUpdatedBy: librarianName, lastBorrower: borrowerName || key.lastBorrower }
      : key));
    const record = { id: uuid(), MvaID, action: "Checked In", librarianName, borrowerName: borrowerName || "", eventDT: now() };
    setBorrowing(b => [...b, record]);
    addAudit(MvaID, `${wasLost ? "Lost key recovered and " : ""}Checked In by Librarian: ${librarianName}, Returned by: ${borrowerName || "unknown"}`, librarianName);
    notify(`Key ${MvaID} ${wasLost ? "recovered and " : ""}checked in`);
  }, [keys, addAudit, notify]);

  const markLost = useCallback((MvaID) => {
    const key = keys.find(k => k.MvaID === MvaID);
    if (!key || key.status === "Lost" || key.status === "Deactivated") return notify("Key cannot be marked as lost", "error");
    setKeys(k => k.map(key => key.MvaID === MvaID
      ? { ...key, status: "Lost", lastUpdated: now(), lastUpdatedBy: currentUser.name }
      : key));
    addAudit(MvaID, `Key marked as Lost by ${currentUser.name}`, currentUser.name);
    notify(`Key ${MvaID} marked as Lost`);
  }, [keys, currentUser, addAudit, notify]);

  const bulkImport = useCallback((rows, confirmed) => {
    if (!confirmed) return;
    let added = 0, skipped = 0;
    const newKeys = [];
    const newAudit = [];
    for (const row of rows) {
      if (!row.MvaID || keys.find(k => k.MvaID === row.MvaID)) { skipped++; continue; }
      newKeys.push({
        MvaID: row.MvaID,
        status: row["Key Status"] || "Checked In",
        location: row["Key Assigned Location"] || LOCATIONS[0],
        numKeys: parseInt(row["# of Keys"] || "1") || 1,
        notes: "",
        dateAdded: now(),
        addedBy: currentUser.name,
        lastUpdated: now(),
        lastUpdatedBy: currentUser.name,
        lastBorrower: "",
      });
      newAudit.push({ id: uuid(), MvaID: row.MvaID, change: "Imported via CSV", user: currentUser.name, dt: now() });
      added++;
    }
    setKeys(k => [...k, ...newKeys]);
    setAudit(a => [...a, ...newAudit]);
    notify(`Imported ${added} keys. Skipped ${skipped} duplicates/invalid.`);
  }, [keys, currentUser, notify]);

  if (!loaded) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a0e1a", color:"#64748b", fontFamily:"monospace", fontSize:"18px" }}>Loading Key Library...</div>;

  const canEdit = currentUser && (currentUser.role === "Admin" || currentUser.role === "Librarian");

  return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", color:"#e2e8f0", fontFamily:"'DM Mono', 'Courier New', monospace", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f1629; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        input, select, textarea { outline: none; }
        button { cursor: pointer; }
        .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:6px; border:none; font-family:'DM Mono',monospace; font-size:12px; font-weight:500; transition:all .15s; letter-spacing:.05em; }
        .btn-primary { background:#3b82f6; color:#fff; }
        .btn-primary:hover { background:#2563eb; }
        .btn-success { background:#22c55e; color:#000; }
        .btn-success:hover { background:#16a34a; }
        .btn-warning { background:#f59e0b; color:#000; }
        .btn-warning:hover { background:#d97706; }
        .btn-danger { background:#ef4444; color:#fff; }
        .btn-danger:hover { background:#dc2626; }
        .btn-ghost { background:transparent; color:#94a3b8; border:1px solid #1e293b; }
        .btn-ghost:hover { background:#1e293b; color:#e2e8f0; }
        .btn-sm { padding:5px 10px; font-size:11px; }
        .card { background:#0f1629; border:1px solid #1e293b; border-radius:10px; padding:20px; }
        .input { background:#0a0e1a; border:1px solid #1e293b; border-radius:6px; color:#e2e8f0; padding:8px 12px; font-family:'DM Mono',monospace; font-size:13px; width:100%; transition:border .15s; }
        .input:focus { border-color:#3b82f6; }
        .tag { display:inline-flex; align-items:center; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:500; letter-spacing:.04em; }
        .nav-item { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; cursor:pointer; transition:all .15s; font-size:13px; color:#64748b; border:none; background:none; width:100%; text-align:left; font-family:inherit; }
        .nav-item:hover { background:#0f1629; color:#94a3b8; }
        .nav-item.active { background:#1e293b; color:#3b82f6; }
        .table-row:hover { background:#111827; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
        .modal { background:#0f1629; border:1px solid #1e293b; border-radius:12px; padding:28px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; }
        .stat-card { background:#0f1629; border:1px solid #1e293b; border-radius:10px; padding:20px 24px; }
        .form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .form-label { font-size:11px; color:#64748b; letter-spacing:.08em; text-transform:uppercase; }
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background: notification.type === "error" ? "#7f1d1d" : "#14532d", border:`1px solid ${notification.type === "error" ? "#ef4444" : "#22c55e"}`, color:"#e2e8f0", padding:"12px 20px", borderRadius:8, fontSize:13, maxWidth:360 }}>
          {notification.msg}
        </div>
      )}

      <div style={{ display:"flex", flex:1, overflow:"hidden", height:"100vh" }}>
        {/* Sidebar */}
        <Sidebar currentUser={currentUser} users={users} setCurrentUser={setCurrentUser} view={view} setView={setView} />

        {/* Main Content */}
        <main style={{ flex:1, overflow:"auto", padding:"28px" }}>
          {view === "dashboard" && (
            <Dashboard keys={keys} borrowing={borrowing} addKey={addKey} removeKey={removeKey} bulkImport={bulkImport} setSelectedKey={setSelectedKey} setView={setView} canEdit={canEdit} checkOut={checkOut} checkIn={checkIn} currentUser={currentUser} notify={notify} />
          )}
          {view === "detail" && selectedKey && (
            <KeyDetail keyData={keys.find(k => k.MvaID === selectedKey)} borrowing={borrowing} audit={audit} checkOut={checkOut} checkIn={checkIn} removeKey={removeKey} markLost={markLost} currentUser={currentUser} canEdit={canEdit} setView={setView} notify={notify} />
          )}
          {view === "audit" && (
            <AuditLog audit={audit} />
          )}
          {view === "reports" && (
            <Reports keys={keys} borrowing={borrowing} />
          )}
          {view === "users" && currentUser?.role === "Admin" && (
            <UsersView users={users} setUsers={setUsers} notify={notify} />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ currentUser, users, setCurrentUser, view, setView }) {
  const navItems = [
    { id: "dashboard", icon: "⬡", label: "Key Inventory" },
    { id: "audit", icon: "◈", label: "Audit Log" },
    { id: "reports", icon: "⬕", label: "Reports" },
    ...(currentUser?.role === "Admin" ? [{ id: "users", icon: "◉", label: "Users" }] : []),
  ];

  return (
    <aside style={{ width:220, background:"#080c18", borderRight:"1px solid #1e293b", display:"flex", flexDirection:"column", padding:"20px 12px", flexShrink:0 }}>
      <div style={{ marginBottom:28, paddingLeft:6 }}>
        <div style={{ fontSize:11, color:"#3b82f6", letterSpacing:".15em", textTransform:"uppercase", marginBottom:4 }}>Key Library</div>
        <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color:"#e2e8f0", letterSpacing:"-.01em" }}>Management System</div>
      </div>

      <nav style={{ display:"flex", flexDirection:"column", gap:2, flex:1 }}>
        {navItems.map(item => (
          <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}>
            <span style={{ fontSize:14 }}>{item.icon}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ borderTop:"1px solid #1e293b", paddingTop:16, marginTop:8 }}>
        <div style={{ fontSize:10, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:".08em" }}>Logged in as</div>
        <select className="input" style={{ fontSize:12, padding:"6px 10px" }} value={currentUser?.id} onChange={e => setCurrentUser(users.find(u => u.id === e.target.value))}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </div>
    </aside>
  );
}

// ─── Dashboard (merged with Inventory) ───────────────────────────────────────
function Dashboard({ keys, borrowing, addKey, removeKey, bulkImport, setSelectedKey, setView, canEdit, checkOut, checkIn, currentUser, notify }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set(["Checked In", "Checked Out", "Lost"]));
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [locFilter, setLocFilter] = useState(new Set(LOCATIONS));
  const [locDropdownOpen, setLocDropdownOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [checkinModal, setCheckinModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const toggleStatus = (s) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const toggleLoc = (l) => {
    setLocFilter(prev => {
      const next = new Set(prev);
      next.has(l) ? next.delete(l) : next.add(l);
      return next;
    });
  };

  const active = keys.filter(k => k.status !== "Deactivated");
  const overdueIds = new Set(keys.filter(k => {
    if (k.status !== "Checked Out") return false;
    const last = borrowing.filter(b => b.MvaID === k.MvaID && b.action === "Checked Out").sort((a,b) => b.eventDT > a.eventDT ? 1 : -1)[0];
    return last && daysSince(last.eventDT) > 1;
  }).map(k => k.MvaID));

  const checkedIn = active.filter(k => k.status === "Checked In").length;
  const checkedOut = active.filter(k => k.status === "Checked Out").length;
  const lost = active.filter(k => k.status === "Lost").length;
  const overdue = overdueIds.size;

  const [activeCard, setActiveCard] = useState(null);

  const handleCardClick = (cardLabel) => {
    if (activeCard === cardLabel) {
      // deselect — reset to defaults
      setActiveCard(null);
      setStatusFilter(new Set(["Checked In", "Checked Out", "Lost"]));
      setSearch("");
      return;
    }
    setActiveCard(cardLabel);
    if (cardLabel === "Total Keys") {
      setStatusFilter(new Set(STATUSES));
      setSearch("");
    } else if (cardLabel === "Checked In") {
      setStatusFilter(new Set(["Checked In"]));
      setSearch("");
    } else if (cardLabel === "Checked Out") {
      setStatusFilter(new Set(["Checked Out"]));
      setSearch("");
    } else if (cardLabel === "Lost") {
      setStatusFilter(new Set(["Lost"]));
      setSearch("");
    } else if (cardLabel === "Overdue (>1 day)") {
      setStatusFilter(new Set(["Checked Out"]));
      setSearch("");
    }
  };

  const filtered = keys.filter(k => {
    if (activeCard === "Overdue (>1 day)" && !overdueIds.has(k.MvaID)) return false;
    if (statusFilter.size > 0 && !statusFilter.has(k.status)) return false;
    if (locFilter.size > 0 && !locFilter.has(k.location)) return false;
    if (search && !k.MvaID.includes(search) && !(k.lastBorrower || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusLabel = statusFilter.size === 0 ? "No Status"
    : statusFilter.size === STATUSES.length ? "All Statuses"
    : statusFilter.size === 1 ? [...statusFilter][0]
    : `${statusFilter.size} Statuses`;

  const locLabel = locFilter.size === 0 ? "No Location"
    : locFilter.size === LOCATIONS.length ? "All Locations"
    : locFilter.size === 1 ? [...locFilter][0]
    : `${locFilter.size} Locations`;

  return (
    <div onClick={() => { setStatusDropdownOpen(false); setLocDropdownOpen(false); }}>
      <PageHeader title="Key Inventory" subtitle={`${active.length} active keys`} />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:28 }}>
        {[
          { label:"Total Keys", val: active.length, color:"#3b82f6" },
          { label:"Checked In", val: checkedIn, color:"#22c55e" },
          { label:"Checked Out", val: checkedOut, color:"#f59e0b" },
          { label:"Lost", val: lost, color:"#ef4444" },
          { label:"Overdue (>1 day)", val: overdue, color:"#f97316" },
        ].map(s => {
          const isActive = activeCard === s.label;
          return (
            <div
              key={s.label}
              className="stat-card"
              onClick={() => handleCardClick(s.label)}
              style={{
                cursor:"pointer",
                border: isActive ? `1px solid ${s.color}66` : "1px solid #1e293b",
                background: isActive ? s.color + "11" : "#0f1629",
                transition:"all .15s",
                userSelect:"none",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = s.color + "44"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = "#1e293b"; }}
            >
              <div style={{ fontSize:11, color: isActive ? s.color : "#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8, transition:"color .15s" }}>{s.label}</div>
              <div style={{ fontSize:32, fontWeight:700, color:s.color, fontFamily:"'Space Grotesk',sans-serif" }}>{s.val}</div>
              {isActive && <div style={{ fontSize:10, color: s.color + "99", marginTop:6, letterSpacing:".06em" }}>FILTERING ↓ click to reset</div>}
            </div>
          );
        })}
      </div>

      {/* Filters + Actions */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <input className="input" placeholder="Search Key ID or Borrower..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:280 }} />

        {/* Multi-select Status Dropdown */}
        <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
          <button
            className="input"
            onClick={() => setStatusDropdownOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, cursor:"pointer", minWidth:160, textAlign:"left", background: statusDropdownOpen ? "#111827" : undefined }}
          >
            <span style={{ fontSize:13 }}>{statusLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: statusDropdownOpen ? "rotate(180deg)" : "none", transition:"transform .15s", flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {statusDropdownOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, minWidth:200, background:"#0f1629", border:"1px solid #1e293b", borderRadius:8, padding:"6px 0", zIndex:200, boxShadow:"0 8px 24px rgba(0,0,0,.5)" }}>
              {/* Select All / Clear */}
              <div style={{ display:"flex", gap:0, borderBottom:"1px solid #1e293b", marginBottom:4 }}>
                <button onClick={() => setStatusFilter(new Set(STATUSES))} style={{ flex:1, padding:"6px 12px", background:"none", border:"none", color:"#64748b", fontSize:11, cursor:"pointer", letterSpacing:".05em", textTransform:"uppercase" }}>All</button>
                <button onClick={() => setStatusFilter(new Set())} style={{ flex:1, padding:"6px 12px", background:"none", border:"none", color:"#64748b", fontSize:11, cursor:"pointer", letterSpacing:".05em", textTransform:"uppercase" }}>None</button>
              </div>
              {STATUSES.map(s => (
                <label key={s} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", cursor:"pointer", transition:"background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#1e293b"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${statusFilter.has(s) ? STATUS_COLOR[s] : "#334155"}`, background: statusFilter.has(s) ? STATUS_COLOR[s] + "33" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .1s" }}>
                    {statusFilter.has(s) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={STATUS_COLOR[s]} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize:12, color: statusFilter.has(s) ? "#e2e8f0" : "#94a3b8" }}>{s}</span>
                  <span className="tag" style={{ marginLeft:"auto", background: STATUS_COLOR[s] + "22", color: STATUS_COLOR[s], fontSize:10 }}>
                    {keys.filter(k => k.status === s).length}
                  </span>
                  <input type="checkbox" checked={statusFilter.has(s)} onChange={() => toggleStatus(s)} style={{ display:"none" }} />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Multi-select Location Dropdown */}
        <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
          <button
            className="input"
            onClick={() => setLocDropdownOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, cursor:"pointer", minWidth:160, textAlign:"left", background: locDropdownOpen ? "#111827" : undefined }}
          >
            <span style={{ fontSize:13 }}>{locLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: locDropdownOpen ? "rotate(180deg)" : "none", transition:"transform .15s", flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {locDropdownOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, minWidth:240, background:"#0f1629", border:"1px solid #1e293b", borderRadius:8, padding:"6px 0", zIndex:200, boxShadow:"0 8px 24px rgba(0,0,0,.5)" }}>
              <div style={{ display:"flex", gap:0, borderBottom:"1px solid #1e293b", marginBottom:4 }}>
                <button onClick={() => setLocFilter(new Set(LOCATIONS))} style={{ flex:1, padding:"6px 12px", background:"none", border:"none", color:"#64748b", fontSize:11, cursor:"pointer", letterSpacing:".05em", textTransform:"uppercase" }}>All</button>
                <button onClick={() => setLocFilter(new Set())} style={{ flex:1, padding:"6px 12px", background:"none", border:"none", color:"#64748b", fontSize:11, cursor:"pointer", letterSpacing:".05em", textTransform:"uppercase" }}>None</button>
              </div>
              {LOCATIONS.map(l => (
                <label key={l} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", cursor:"pointer", transition:"background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#1e293b"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${locFilter.has(l) ? "#3b82f6" : "#334155"}`, background: locFilter.has(l) ? "#3b82f622" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .1s" }}>
                    {locFilter.has(l) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize:12, color: locFilter.has(l) ? "#e2e8f0" : "#94a3b8" }}>{l}</span>
                  <span className="tag" style={{ marginLeft:"auto", background:"#1e293b", color:"#64748b", fontSize:10 }}>
                    {keys.filter(k => k.location === l).length}
                  </span>
                  <input type="checkbox" checked={locFilter.has(l)} onChange={() => toggleLoc(l)} style={{ display:"none" }} />
                </label>
              ))}
            </div>
          )}
        </div>
        {canEdit && (
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <button className="btn btn-ghost" onClick={() => setShowImport(true)}>⬆ Import CSV</button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Key</button>
          </div>
        )}
        <button
          className="btn btn-ghost"
          onClick={() => setShowExport(true)}
          style={{ display:"flex", alignItems:"center", gap:6 }}
          title={`Export ${filtered.length} filtered keys as CSV`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Key Table */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#080c18", borderBottom:"1px solid #1e293b" }}>
              {["MvaID","Status","Location","Borrower","Last Updated By","Last Updated Datetime","Days Out","Actions"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#64748b", fontWeight:500, letterSpacing:".06em", fontSize:11, textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => {
              // Compute days out
              let daysOut = 0;
              if (k.status === "Checked Out" || k.status === "Lost") {
                const lastEvent = [...borrowing]
                  .filter(b => b.MvaID === k.MvaID && (b.action === "Checked Out" || b.action === "Checked In"))
                  .sort((a, b) => b.eventDT > a.eventDT ? 1 : -1)[0];
                if (lastEvent) daysOut = daysSince(lastEvent.eventDT);
                else daysOut = daysSince(k.lastUpdated);
              }
              const isOverdue = daysOut > 1 && k.status === "Checked Out";
              const isLostLong = k.status === "Lost" && daysOut > 0;
              return (
              <tr key={k.MvaID} className="table-row" style={{ borderBottom:"1px solid #1e293b" }}>
                <td style={{ padding:"12px 16px" }}>
                  <button onClick={() => { setSelectedKey(k.MvaID); setView("detail"); }} style={{ background:"none", border:"none", color:"#60a5fa", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:13, textDecoration:"underline" }}>{k.MvaID}</button>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span className="tag" style={{ background: STATUS_COLOR[k.status] + "22", color: STATUS_COLOR[k.status] }}>{k.status}</span>
                </td>
                <td style={{ padding:"12px 16px", color:"#94a3b8", maxWidth:140 }}><span title={k.location} style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.location}</span></td>
                <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{k.lastBorrower || "—"}</td>
                <td style={{ padding:"12px 16px", color:"#64748b" }}>{k.lastUpdatedBy}</td>
                <td style={{ padding:"12px 16px", color:"#64748b", fontSize:11 }}>{fmtDT(k.lastUpdated)}</td>
                <td style={{ padding:"12px 16px" }}>
                  {k.status === "Checked In" || k.status === "Deactivated"
                    ? <span style={{ color:"#475569" }}>—</span>
                    : <span style={{ color: isOverdue || isLostLong ? "#ef4444" : "#f59e0b", fontWeight: isOverdue || isLostLong ? 600 : 400 }}>
                        {daysOut}d {isOverdue ? "⚠" : isLostLong ? "⚠" : ""}
                      </span>
                  }
                </td>
                <td style={{ padding:"10px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {canEdit && k.status === "Checked In" && (
                      <button className="btn btn-warning btn-sm" onClick={() => setCheckoutModal(k.MvaID)}>Checkout</button>
                    )}
                    {canEdit && (k.status === "Checked Out" || k.status === "Lost") && (
                      <button className="btn btn-success btn-sm" onClick={() => setCheckinModal(k.MvaID)}>Checkin</button>
                    )}
                    {(currentUser?.role === "Admin" || currentUser?.role === "Librarian") && k.status !== "Deactivated" && (
                      <button className="btn btn-danger btn-sm" title="Delete Key" onClick={() => setConfirmDelete(k.MvaID)} style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding:"40px", textAlign:"center", color:"#475569" }}>No keys found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddKeyModal onAdd={(d) => { addKey(d); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
      {showImport && <ImportModal onImport={bulkImport} onClose={() => setShowImport(false)} notify={notify} />}
      {showExport && <ExportModal filteredKeys={filtered} borrowing={borrowing} onClose={() => setShowExport(false)} />}
      {checkoutModal && <CheckOutModal MvaID={checkoutModal} currentUser={currentUser} checkOut={checkOut} onClose={() => setCheckoutModal(null)} />}
      {checkinModal && <CheckInModal MvaID={checkinModal} currentUser={currentUser} checkIn={checkIn} onClose={() => setCheckinModal(null)} />}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete Key ${confirmDelete}`}
          message={`This will mark key ${confirmDelete} as Deactivated and log the deletion in the audit history. This action cannot be undone.`}
          confirmLabel="Delete Key"
          danger={true}
          onConfirm={() => removeKey(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Key Detail ───────────────────────────────────────────────────────────────
function KeyDetail({ keyData, borrowing, audit, checkOut, checkIn, removeKey, markLost, currentUser, canEdit, setView, notify }) {
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkinModal, setCheckinModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLost, setConfirmLost] = useState(false);
  if (!keyData) return <div style={{ color:"#64748b", padding:40 }}>Key not found.</div>;

  const keyHistory = borrowing.filter(b => b.MvaID === keyData.MvaID).sort((a,b) => b.eventDT > a.eventDT ? 1 : -1);
  const keyAudit = audit.filter(a => a.MvaID === keyData.MvaID).sort((a,b) => b.dt > a.dt ? 1 : -1);

  const lastCheckout = keyHistory.find(h => h.action === "Checked Out");
  const daysOut = lastCheckout ? daysSince(lastCheckout.eventDT) : null;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setView("dashboard")}>← Back</button>
        <PageHeader title={`Key ${keyData.MvaID}`} subtitle="Key Details" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Key Information</h3>
          <InfoRow label="MvaID" value={keyData.MvaID} />
          <InfoRow label="Status" value={<span className="tag" style={{ background: STATUS_COLOR[keyData.status] + "22", color: STATUS_COLOR[keyData.status] }}>{keyData.status}</span>} />
          <InfoRow label="Location" value={keyData.location} />
          <InfoRow label="# of Keys" value={keyData.numKeys || "—"} />
          <InfoRow label="Notes" value={keyData.notes || "—"} />
          <InfoRow label="Added" value={fmtDT(keyData.dateAdded)} />
          <InfoRow label="Added By" value={keyData.addedBy} />
          {(keyData.status === "Checked Out" || keyData.status === "Lost") && daysOut !== null && (
            <InfoRow label="Days Out" value={<span style={{ color: daysOut > 1 ? "#ef4444" : "#f59e0b" }}>{daysOut} day{daysOut !== 1 ? "s" : ""} {daysOut > 1 ? "⚠ OVERDUE" : ""}</span>} />
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Last Transaction</h3>
          <InfoRow label="Last Updated" value={fmtDT(keyData.lastUpdated)} />
          <InfoRow label="Last Updated By" value={keyData.lastUpdatedBy || "—"} />
          <InfoRow label="Last Borrower" value={keyData.lastBorrower || "—"} />
          
          {canEdit && (
            <div style={{ marginTop:20, display:"flex", gap:8, flexWrap:"wrap" }}>
              {keyData.status === "Checked In" && (
                <button className="btn btn-warning" onClick={() => setCheckoutModal(true)}>Check Out</button>
              )}
              {(keyData.status === "Checked Out" || keyData.status === "Lost") && (
                <button className="btn btn-success" onClick={() => setCheckinModal(true)}>Check In</button>
              )}
              {(keyData.status === "Checked In" || keyData.status === "Checked Out") && (
                <button className="btn" onClick={() => setConfirmLost(true)} style={{ background:"#78350f", color:"#fcd34d", border:"1px solid #92400e", display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="11"/><line x1="11" y1="14" x2="11.01" y2="14"/></svg>
                  Mark as Lost
                </button>
              )}
              {(currentUser?.role === "Admin" || currentUser?.role === "Librarian") && keyData.status !== "Deactivated" && (
                <button className="btn btn-danger" title="Delete Key" onClick={() => setConfirmDelete(true)} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Delete Key
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Borrowing History */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Check-In / Check-Out History</h3>
        {keyHistory.length === 0 ? <p style={{ color:"#475569", fontSize:13 }}>No transaction history.</p> : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:"1px solid #1e293b" }}>
              {["Action","Librarian","Borrower","Date"].map(h => <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:"#64748b", fontSize:11, textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {keyHistory.map(h => (
                <tr key={h.id} style={{ borderBottom:"1px solid #0f1629" }}>
                  <td style={{ padding:"8px 12px" }}><span className="tag" style={{ background: h.action === "Checked Out" ? "#f59e0b22" : "#22c55e22", color: h.action === "Checked Out" ? "#f59e0b" : "#22c55e" }}>{h.action}</span></td>
                  <td style={{ padding:"8px 12px", color:"#94a3b8" }}>{h.librarianName}</td>
                  <td style={{ padding:"8px 12px", color:"#94a3b8" }}>{h.borrowerName || "—"}</td>
                  <td style={{ padding:"8px 12px", color:"#64748b", fontSize:11 }}>{fmtDT(h.eventDT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Audit Trail */}
      <div className="card">
        <h3 style={{ fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Audit Trail</h3>
        {keyAudit.length === 0 ? <p style={{ color:"#475569", fontSize:13 }}>No audit records.</p> : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {keyAudit.map(a => (
              <div key={a.id} style={{ padding:"10px 14px", background:"#080c18", borderRadius:6, fontSize:12, display:"flex", justifyContent:"space-between", gap:16 }}>
                <span style={{ color:"#94a3b8" }}>{a.change}</span>
                <div style={{ display:"flex", gap:12, color:"#64748b", fontSize:11, flexShrink:0 }}>
                  <span>{a.user}</span>
                  <span>{fmtDT(a.dt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {checkoutModal && <CheckOutModal MvaID={keyData.MvaID} currentUser={currentUser} checkOut={checkOut} onClose={() => setCheckoutModal(false)} />}
      {checkinModal && <CheckInModal MvaID={keyData.MvaID} currentUser={currentUser} checkIn={checkIn} onClose={() => setCheckinModal(false)} />}
      {confirmLost && (
        <ConfirmModal
          title={`Mark Key ${keyData.MvaID} as Lost`}
          message={`This will change the key status to Lost and log the action in the audit history.`}
          confirmLabel="Mark as Lost"
          danger={true}
          onConfirm={() => markLost(keyData.MvaID)}
          onClose={() => setConfirmLost(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete Key ${keyData.MvaID}`}
          message={`This will mark key ${keyData.MvaID} as Deactivated and log the deletion in the audit history. This action cannot be undone.`}
          confirmLabel="Delete Key"
          danger={true}
          onConfirm={() => { removeKey(keyData.MvaID); setView("inventory"); }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditLog({ audit }) {
  const [search, setSearch] = useState("");
  const sorted = [...audit].sort((a,b) => b.dt > a.dt ? 1 : -1);
  const filtered = sorted.filter(a => !search || a.MvaID.includes(search) || a.change.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Full immutable transaction history" />
      <input className="input" placeholder="Search by Key ID, change, or user..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:380, marginBottom:20 }} />
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ background:"#080c18", borderBottom:"1px solid #1e293b" }}>
            {["DateTime","MvaID","Change","User"].map(h => <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="table-row" style={{ borderBottom:"1px solid #1e293b" }}>
                <td style={{ padding:"10px 16px", color:"#64748b", fontSize:11 }}>{fmtDT(a.dt)}</td>
                <td style={{ padding:"10px 16px", color:"#60a5fa", fontFamily:"'DM Mono',monospace" }}>{a.MvaID}</td>
                <td style={{ padding:"10px 16px", color:"#94a3b8" }}>{a.change}</td>
                <td style={{ padding:"10px 16px", color:"#64748b" }}>{a.user}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} style={{ padding:"40px", textAlign:"center", color:"#475569" }}>No records found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports({ keys, borrowing }) {
  const checkedOut = keys.filter(k => k.status === "Checked Out");

  const rows = checkedOut.map(k => {
    const lastCheckout = [...borrowing].filter(b => b.MvaID === k.MvaID && b.action === "Checked Out").sort((a,b) => b.eventDT > a.eventDT ? 1 : -1)[0];
    return {
      MvaID: k.MvaID,
      borrower: k.lastBorrower || "",
      checkedOutDate: lastCheckout?.eventDT || "",
      status: k.status,
      daysOut: lastCheckout ? daysSince(lastCheckout.eventDT) : 0,
      lastUpdated: k.lastUpdated,
      lastUpdatedBy: k.lastUpdatedBy,
    };
  }).sort((a,b) => b.daysOut - a.daysOut);

  const downloadCSV = () => {
    const headers = ["Key ID","Checked Out To","Checked Out Date","Status","Days Outstanding","Last Updated Date","Last Updated By"];
    const csvRows = [headers, ...rows.map(r => [r.MvaID, r.borrower, fmtDT(r.checkedOutDate), r.status, r.daysOut, fmtDT(r.lastUpdated), r.lastUpdatedBy])];
    const csv = csvRows.map(row => row.map(csvEscape).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `keys-checked-out-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadFull = () => {
    const headers = ["MvaID","Current Status","Assigned Location","Number of Keys","Last Updated DateTime","Last Updated By Name","Last Known Borrower Name"];
    const csvRows = [headers, ...keys.map(k => [k.MvaID, k.status, k.location, k.numKeys || "", fmtDT(k.lastUpdated), k.lastUpdatedBy, k.lastBorrower || ""])];
    const csv = csvRows.map(row => row.map(csvEscape).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `full-inventory-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Download CSV reports" />

      <div style={{ display:"flex", gap:12, marginBottom:24 }}>
        <button className="btn btn-primary" onClick={downloadCSV}>⬇ Checked Out Keys Report</button>
        <button className="btn btn-ghost" onClick={downloadFull}>⬇ Full Inventory Export</button>
      </div>

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, color:"#94a3b8" }}>Currently Checked Out Keys — {rows.length} records</span>
          {rows.some(r => r.daysOut > 1) && <span style={{ fontSize:12, color:"#ef4444" }}>⚠ {rows.filter(r => r.daysOut > 1).length} overdue</span>}
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ background:"#080c18", borderBottom:"1px solid #1e293b" }}>
            {["Key ID","Checked Out To","Date","Days Out","Last Updated By"].map(h => <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.MvaID} className="table-row" style={{ borderBottom:"1px solid #1e293b" }}>
                <td style={{ padding:"10px 16px", color:"#60a5fa", fontFamily:"'DM Mono',monospace" }}>{r.MvaID}</td>
                <td style={{ padding:"10px 16px", color:"#94a3b8" }}>{r.borrower || "—"}</td>
                <td style={{ padding:"10px 16px", color:"#64748b", fontSize:11 }}>{fmtDT(r.checkedOutDate)}</td>
                <td style={{ padding:"10px 16px" }}>
                  <span style={{ color: r.daysOut > 1 ? "#ef4444" : r.daysOut === 1 ? "#f59e0b" : "#94a3b8" }}>
                    {r.daysOut}d {r.daysOut > 1 ? "⚠" : ""}
                  </span>
                </td>
                <td style={{ padding:"10px 16px", color:"#64748b" }}>{r.lastUpdatedBy}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#475569" }}>No keys currently checked out</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Users (Admin) ────────────────────────────────────────────────────────────
function UsersView({ users, setUsers, notify }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Librarian");
  const [confirmRemove, setConfirmRemove] = useState(null); // user id

  const addUser = () => {
    if (!name.trim()) return notify("Name required", "error");
    if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) return notify("User already exists", "error");
    setUsers(u => [...u, { id: uuid(), name: name.trim(), role }]);
    setName(""); notify("User added");
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage system users and roles" />
      <div className="card" style={{ maxWidth:500, marginBottom:24 }}>
        <h3 style={{ fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Add User</h3>
        <div className="form-group"><label className="form-label">Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
        <div className="form-group"><label className="form-label">Role</label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={addUser}>Add User</button>
      </div>
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ background:"#080c18", borderBottom:"1px solid #1e293b" }}>
            {["Name","Role","Actions"].map(h => <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#64748b", fontSize:11, textTransform:"uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="table-row" style={{ borderBottom:"1px solid #1e293b" }}>
                <td style={{ padding:"12px 16px", color:"#e2e8f0" }}>{u.name}</td>
                <td style={{ padding:"12px 16px" }}>
                  <span className="tag" style={{ background:"#1e293b", color:"#94a3b8" }}>{u.role}</span>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmRemove(u.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmRemove && (
        <ConfirmModal
          title="Remove User"
          message={`Remove user "${users.find(u => u.id === confirmRemove)?.name}"? They will no longer be able to log in.`}
          confirmLabel="Remove User"
          danger={true}
          onConfirm={() => setUsers(us => us.filter(x => x.id !== confirmRemove))}
          onClose={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          {danger && (
            <div style={{ width:36, height:36, borderRadius:"50%", background:"#7f1d1d", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
          )}
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, color:"#e2e8f0" }}>{title}</h2>
        </div>
        <p style={{ fontSize:13, color:"#94a3b8", marginBottom:24, lineHeight:1.6 }}>{message}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ filteredKeys, borrowing, onClose }) {
  const [copied, setCopied] = useState(false);

  const headers = ["MvaID","Status","Location","Borrower","Last Updated By","Last Updated Datetime","Days Out"];
  const rows = filteredKeys.map(k => {
    let daysOut = 0;
    if (k.status === "Checked Out" || k.status === "Lost") {
      const lastEvent = [...borrowing]
        .filter(b => b.MvaID === k.MvaID && (b.action === "Checked Out" || b.action === "Checked In"))
        .sort((a, b) => b.eventDT > a.eventDT ? 1 : -1)[0];
      daysOut = lastEvent ? daysSince(lastEvent.eventDT) : daysSince(k.lastUpdated);
    }
    return [k.MvaID, k.status, k.location, k.lastBorrower || "", k.lastUpdatedBy, fmtDT(k.lastUpdated), daysOut > 0 ? `${daysOut}d` : "0"];
  });
  const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:680 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, marginBottom:2 }}>Export CSV</h2>
            <p style={{ fontSize:12, color:"#64748b" }}>{filteredKeys.length} rows — paste into Excel, Google Sheets, or save as .csv</p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={copy}
            style={{ display:"flex", alignItems:"center", gap:6, color: copied ? "#22c55e" : undefined, borderColor: copied ? "#22c55e44" : undefined, flexShrink:0 }}
          >
            {copied
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy All</>
            }
          </button>
        </div>

        <textarea
          readOnly
          value={csv}
          onClick={e => e.target.select()}
          style={{
            width:"100%", height:320, background:"#080c18", border:"1px solid #1e293b", borderRadius:8,
            color:"#94a3b8", fontFamily:"'DM Mono',monospace", fontSize:11, padding:"12px 14px",
            resize:"none", lineHeight:1.6, outline:"none"
          }}
        />
        <p style={{ fontSize:11, color:"#475569", marginTop:8 }}>Click inside to select all, then Ctrl+C / Cmd+C — or use Copy All above.</p>

        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function CheckOutModal({ MvaID, currentUser, checkOut, onClose }) {
  const [librarian, setLibrarian] = useState(currentUser?.name || "");
  const [borrower, setBorrower] = useState("");
  const submit = () => { if (!librarian || !borrower) return; checkOut(MvaID, borrower, librarian); onClose(); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", marginBottom:20, fontSize:18 }}>Check Out Key {MvaID}</h2>
        <div className="form-group"><label className="form-label">Librarian Name *</label><input className="input" value={librarian} onChange={e => setLibrarian(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Borrower Name *</label><input className="input" value={borrower} onChange={e => setBorrower(e.target.value)} placeholder="Who is borrowing this key?" /></div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-warning" onClick={submit}>Check Out</button>
        </div>
      </div>
    </div>
  );
}

function CheckInModal({ MvaID, currentUser, checkIn, onClose }) {
  const [librarian, setLibrarian] = useState(currentUser?.name || "");
  const [borrower, setBorrower] = useState("");
  const submit = () => { if (!librarian || !borrower) return; checkIn(MvaID, librarian, borrower); onClose(); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", marginBottom:20, fontSize:18 }}>Check In Key {MvaID}</h2>
        <div className="form-group"><label className="form-label">Librarian Name *</label><input className="input" value={librarian} onChange={e => setLibrarian(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Borrower Name *</label><input className="input" value={borrower} onChange={e => setBorrower(e.target.value)} placeholder="Who is returning this key?" /></div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={submit}>Check In</button>
        </div>
      </div>
    </div>
  );
}

function AddKeyModal({ onAdd, onClose }) {
  const [MvaID, setMvaID] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [notes, setNotes] = useState("");
  const [numKeys, setNumKeys] = useState("");
  const submit = () => { onAdd({ MvaID: MvaID.trim(), location, notes, numKeys: parseInt(numKeys) || 1 }); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", marginBottom:20, fontSize:18 }}>Add New Key</h2>
        <div className="form-group"><label className="form-label">MvaID (8-digit) *</label><input className="input" value={MvaID} onChange={e => setMvaID(e.target.value)} placeholder="12345678" maxLength={8} /></div>
        <div className="form-group"><label className="form-label">Assigned Location *</label>
          <select className="input" value={location} onChange={e => setLocation(e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label"># of Keys</label><input className="input" type="number" value={numKeys} onChange={e => setNumKeys(e.target.value)} placeholder="1" min={1} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Add Key</button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onImport, onClose, notify }) {
  const [preview, setPreview] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [showSample, setShowSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  const SAMPLE_HEADERS = ["MvaID", "Key Assigned Location", "Key Status", "# of Keys"];
  const SAMPLE_ROWS = [
    ["10000001", "Stone Mountain Hub", "Checked In", "1"],
    ["10000002", "Stone Mountain Hub", "Checked Out", "1"],
    ["10000003", "Aux Lot – Rock Chapel", "Checked In", "2"],
    ["10000004", "Aux Lot – Jabco", "Lost", "1"],
    ["10000005", "Off-site Vended", "Checked In", "3"],
    ["10000006", "With Customer", "Checked Out", ""],
  ];
  const sampleCSV = [SAMPLE_HEADERS, ...SAMPLE_ROWS].map(row => row.join(",")).join("\n");

  const copySample = () => {
    const headerRow = "MvaID\tKey Assigned Location\tKey Status\t# of Keys";
    navigator.clipboard.writeText(headerRow).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] || "");
        return obj;
      });
      setRawRows(rows);
      setPreview(rows.slice(0, 10));
    };
    reader.readAsText(file);
  };

  const confirm = () => { onImport(rawRows, true); onClose(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:640 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", marginBottom:4, fontSize:18 }}>Import Keys from CSV</h2>
        <p style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Required columns: MvaID, Key Assigned Location, Key Status. Optional: # of Keys</p>

        {/* Sample template section */}
        <div style={{ background:"#0a0e1a", border:"1px solid #1e293b", borderRadius:8, marginBottom:20, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", gap:16 }}>
            <div>
              <div style={{ fontSize:12, color:"#94a3b8", marginBottom:2 }}>Not sure about the format?</div>
              <div style={{ fontSize:11, color:"#64748b" }}>View the required column headers and example rows below.</div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSample(s => !s)} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {showSample ? "Hide" : "View Template"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={copySample} style={{ display:"flex", alignItems:"center", gap:5, color: copied ? "#22c55e" : undefined, borderColor: copied ? "#22c55e44" : undefined }}>
                {copied
                  ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                  : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy CSV Columns</>
                }
              </button>
            </div>
          </div>

          {showSample && (
            <div style={{ borderTop:"1px solid #1e293b", overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background:"#080c18" }}>
                    {SAMPLE_HEADERS.map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:"#3b82f6", fontWeight:600, letterSpacing:".04em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row, i) => (
                    <tr key={i} style={{ borderTop:"1px solid #0f1629" }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding:"7px 12px", color:"#64748b", whiteSpace:"nowrap" }}>{cell || <span style={{ color:"#334155", fontStyle:"italic" }}>optional</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display:"none" }} />
        <button className="btn btn-ghost" onClick={() => fileRef.current.click()} style={{ marginBottom:16 }}>Choose CSV File</button>

        {preview && (
          <>
            <p style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>Preview ({rawRows.length} rows):</p>
            <div style={{ overflowX:"auto", marginBottom:16 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead><tr style={{ borderBottom:"1px solid #1e293b" }}>
                  {Object.keys(preview[0]).map(h => <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"#64748b" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {preview.map((r,i) => <tr key={i} style={{ borderBottom:"1px solid #0f1629" }}>
                    {Object.values(r).map((v,j) => <td key={j} style={{ padding:"6px 10px", color:"#94a3b8" }}>{v}</td>)}
                  </tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {preview && <button className="btn btn-primary" onClick={confirm}>Confirm Import ({rawRows.length} rows)</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:700, color:"#e2e8f0", letterSpacing:"-.02em", marginBottom:2 }}>{title}</h1>
      {subtitle && <p style={{ fontSize:12, color:"#64748b", letterSpacing:".04em" }}>{subtitle}</p>}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1e293b", gap:16 }}>
      <span style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:"#e2e8f0", textAlign:"right" }}>{value}</span>
    </div>
  );
}
