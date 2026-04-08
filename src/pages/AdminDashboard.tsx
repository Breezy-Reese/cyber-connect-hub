// src/pages/AdminDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface Computer {
  _id: string;
  computer_name: string;
  ip_address?: string;
  status: "available" | "in_use" | "maintenance" | "offline";
  hourly_rate: number;
  specifications?: { processor?: string; ram?: string; storage?: string; os?: string };
  current_session?: Session | null;
}

interface Session {
  _id: string;
  user: { _id: string; username: string };
  computer: { _id: string; computer_name: string; hourly_rate: number };
  start_time: string;
  remaining_time: number;
  total_cost: number;
  status: string;
  hourly_rate_at_start: number;
}

interface Request {
  _id: string;
  user: { _id: string; username: string };
  session?: { _id: string; computer: string };
  type: string;
  details?: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const statusColor: Record<string, string> = {
  available: "#10b981",
  in_use: "#00d4ff",
  maintenance: "#f59e0b",
  offline: "#6b7280",
};

const statusBg: Record<string, string> = {
  available: "rgba(16,185,129,0.1)",
  in_use: "rgba(0,212,255,0.1)",
  maintenance: "rgba(245,158,11,0.1)",
  offline: "rgba(107,114,128,0.1)",
};

// ── Component ────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [computers, setComputers] = useState<Computer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"computers" | "sessions" | "requests">("computers");
  const [tick, setTick] = useState(0);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [compRes, sessRes, reqRes] = await Promise.all([
        fetch(`${API}/computers`, { headers }),
        fetch(`${API}/sessions/active`, { headers }),
        fetch(`${API}/requests/pending`, { headers }),
      ]);
      const [comp, sess, req] = await Promise.all([compRes.json(), sessRes.json(), reqRes.json()]);
      setComputers(comp.computers || comp || []);
      setSessions(sess.sessions || sess || []);
      setRequests(req.requests || req || []);
      const total = (sess.sessions || sess || []).reduce(
        (sum: number, s: Session) => sum + (s.total_cost || 0), 0
      );
      setEarnings(total);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Countdown tick every second
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Refresh data every 30s
  useEffect(() => {
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleRequest = async (id: string, action: "approved" | "rejected") => {
    await fetch(`${API}/requests/${id}/${action}`, { method: "PATCH", headers });
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  const addTime = async (sessionId: string, minutes: number) => {
    await fetch(`${API}/sessions/${sessionId}/add-time`, {
      method: "POST",
      headers,
      body: JSON.stringify({ minutes }),
    });
    fetchAll();
  };

  const endSession = async (sessionId: string) => {
    if (!confirm("End this session?")) return;
    await fetch(`${API}/sessions/${sessionId}/end`, { method: "POST", headers });
    fetchAll();
  };

  const updateComputerStatus = async (id: string, status: string) => {
    await fetch(`${API}/computers/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const handleLogout = () => { logout(); navigate("/"); };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const available = computers.filter((c) => c.status === "available").length;
  const inUse = computers.filter((c) => c.status === "in_use").length;
  const maintenance = computers.filter((c) => c.status === "maintenance").length;

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={S.loader}>
        <div style={S.loaderDot} />
        <span style={S.loaderText}>Loading admin panel...</span>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.scanlines} />

      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <h1 style={S.headerTitle}>NETZONE ADMIN</h1>
            <p style={S.headerSub}>Management Console</p>
          </div>
        </div>
        <div style={S.headerRight}>
          <div style={S.liveIndicator}>
            <span style={S.liveDot} />
            LIVE
          </div>
          <button onClick={handleLogout} style={S.logoutBtn}>⏻ Logout</button>
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <div style={S.statsGrid}>
        {[
          { label: "Total PCs", value: computers.length, color: "#00d4ff", icon: "🖥" },
          { label: "In Use", value: inUse, color: "#a78bfa", icon: "⚡" },
          { label: "Available", value: available, color: "#10b981", icon: "✓" },
          { label: "Maintenance", value: maintenance, color: "#f59e0b", icon: "⚙" },
          { label: "Pending Requests", value: requests.length, color: "#f87171", icon: "!" },
          { label: "Today's Earnings", value: `$${earnings.toFixed(2)}`, color: "#10b981", icon: "$" },
        ].map((s) => (
          <div key={s.label} style={S.statCard}>
            <div style={{ ...S.statIcon, color: s.color }}>{s.icon}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabs}>
        {(["computers", "sessions", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
          >
            {tab === "computers" && "🖥 "} 
            {tab === "sessions" && "⏱ "}
            {tab === "requests" && "📋 "}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "requests" && requests.length > 0 && (
              <span style={S.badge}>{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Computers Tab ── */}
      {activeTab === "computers" && (
        <div style={S.grid}>
          {computers.length === 0 && <EmptyState text="No computers registered" />}
          {computers.map((pc) => (
            <div key={pc._id} style={S.pcCard}>
              <div style={S.pcHeader}>
                <div style={S.pcIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={statusColor[pc.status]} strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={S.pcName}>{pc.computer_name}</p>
                  {pc.ip_address && <p style={S.pcIp}>{pc.ip_address}</p>}
                </div>
                <div style={{
                  ...S.statusBadge,
                  color: statusColor[pc.status],
                  background: statusBg[pc.status],
                  border: `1px solid ${statusColor[pc.status]}44`,
                }}>
                  {pc.status.replace("_", " ")}
                </div>
              </div>

              {pc.specifications && (
                <div style={S.specs}>
                  {pc.specifications.processor && <span style={S.spec}>CPU: {pc.specifications.processor}</span>}
                  {pc.specifications.ram && <span style={S.spec}>RAM: {pc.specifications.ram}</span>}
                  {pc.specifications.os && <span style={S.spec}>OS: {pc.specifications.os}</span>}
                </div>
              )}

              <div style={S.pcFooter}>
                <span style={S.pcRate}>${pc.hourly_rate.toFixed(2)}/hr</span>
                <div style={S.pcActions}>
                  {pc.status !== "available" && (
                    <button style={{ ...S.actionBtn, color: "#10b981" }}
                      onClick={() => updateComputerStatus(pc._id, "available")}>
                      Set Available
                    </button>
                  )}
                  {pc.status !== "maintenance" && (
                    <button style={{ ...S.actionBtn, color: "#f59e0b" }}
                      onClick={() => updateComputerStatus(pc._id, "maintenance")}>
                      Maintenance
                    </button>
                  )}
                  {pc.status !== "offline" && (
                    <button style={{ ...S.actionBtn, color: "#6b7280" }}
                      onClick={() => updateComputerStatus(pc._id, "offline")}>
                      Offline
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sessions Tab ── */}
      {activeTab === "sessions" && (
        <div style={S.tableWrap}>
          {sessions.length === 0 && <EmptyState text="No active sessions" />}
          {sessions.length > 0 && (
            <table style={S.table}>
              <thead>
                <tr>
                  {["User", "PC", "Started", "Remaining", "Cost", "Actions"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const remaining = Math.max(0, s.remaining_time - tick);
                  const elapsed = Math.floor((Date.now() - new Date(s.start_time).getTime()) / 1000);
                  const cost = (elapsed / 3600) * s.hourly_rate_at_start;
                  return (
                    <tr key={s._id} style={S.tr}>
                      <td style={S.td}>
                        <span style={S.username}>{s.user?.username || "Guest"}</span>
                      </td>
                      <td style={S.td}>
                        <span style={S.pcTag}>{s.computer?.computer_name || "—"}</span>
                      </td>
                      <td style={S.td}>
                        <span style={S.muted}>
                          {new Date(s.start_time).toLocaleTimeString()}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{
                          ...S.timer,
                          color: remaining < 300 ? "#f87171" : "#00d4ff",
                        }}>
                          {fmt(remaining)}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ color: "#10b981", fontFamily: "monospace" }}>
                          ${cost.toFixed(2)}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={S.sessionActions}>
                          <button style={{ ...S.iconBtn, color: "#10b981" }}
                            title="Add 30 min" onClick={() => addTime(s._id, 30)}>+30m</button>
                          <button style={{ ...S.iconBtn, color: "#f59e0b" }}
                            title="Add 60 min" onClick={() => addTime(s._id, 60)}>+1hr</button>
                          <button style={{ ...S.iconBtn, color: "#f87171" }}
                            title="End session" onClick={() => endSession(s._id)}>End</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Requests Tab ── */}
      {activeTab === "requests" && (
        <div style={S.requestList}>
          {requests.length === 0 && <EmptyState text="No pending requests" />}
          {requests.map((r) => (
            <div key={r._id} style={S.requestCard}>
              <div style={S.requestLeft}>
                <div style={S.requestType}>
                  {r.type === "print" && "🖨"}
                  {r.type === "time_extension" && "⏱"}
                  {r.type === "assistance" && "🆘"}
                  {r.type === "food" && "🍔"}
                  {r.type === "drink" && "☕"}
                  {r.type === "service" && "🔧"}
                  {" "}{r.type.replace("_", " ")}
                </div>
                <div style={S.requestMeta}>
                  <span style={S.username}>{r.user?.username}</span>
                  <span style={S.muted}>
                    {new Date(r.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {r.details && Object.keys(r.details).length > 0 && (
                  <p style={S.requestDetails}>
                    {JSON.stringify(r.details)}
                  </p>
                )}
              </div>
              <div style={S.requestBtns}>
                <button style={S.approveBtn} onClick={() => handleRequest(r._id, "approved")}>
                  ✓ Approve
                </button>
                <button style={S.rejectBtn} onClick={() => handleRequest(r._id, "rejected")}>
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ text }: { text: string }) => (
  <div style={{
    textAlign: "center", padding: "3rem", color: "#374151",
    fontFamily: "'Share Tech Mono', monospace", fontSize: "0.85rem",
    letterSpacing: "0.1em",
  }}>
    <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.4 }}>◌</div>
    {text}
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0e1a",
    color: "#e2e8f0",
    fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
    padding: "0 0 3rem",
    position: "relative",
  },
  scanlines: {
    position: "fixed", inset: 0,
    backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)",
    pointerEvents: "none", zIndex: 0,
  },
  loader: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
  },
  loaderDot: {
    width: 12, height: 12, borderRadius: "50%", background: "#00d4ff",
    animation: "pulse 1s infinite",
  },
  loaderText: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: "0.8rem",
    color: "#4a5568", letterSpacing: "0.15em",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1.25rem 2rem", borderBottom: "1px solid #1e2d4a",
    background: "#0f1525", position: "relative", zIndex: 1,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  headerIcon: {
    width: 42, height: 42, borderRadius: 10,
    background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: "1.2rem", fontWeight: 600, letterSpacing: "0.15em",
    color: "#00d4ff", margin: 0,
  },
  headerSub: {
    fontSize: "0.68rem", color: "#4a5568", letterSpacing: "0.15em",
    fontFamily: "'Share Tech Mono', monospace", margin: 0,
  },
  headerRight: { display: "flex", alignItems: "center", gap: "1rem" },
  liveIndicator: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: "0.7rem", color: "#10b981", letterSpacing: "0.15em",
    fontFamily: "'Share Tech Mono', monospace",
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%", background: "#10b981",
    display: "inline-block",
  },
  logoutBtn: {
    padding: "0.4rem 0.9rem", border: "1px solid #1e2d4a", borderRadius: 6,
    background: "transparent", color: "#6b7280", cursor: "pointer",
    fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", letterSpacing: "0.05em",
  },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12, padding: "1.5rem 2rem", position: "relative", zIndex: 1,
  },
  statCard: {
    background: "#0f1525", border: "1px solid #1e2d4a", borderRadius: 12,
    padding: "1rem", textAlign: "center",
  },
  statIcon: { fontSize: "1.2rem", marginBottom: "0.5rem" },
  statValue: { fontSize: "1.8rem", fontWeight: 600, lineHeight: 1, marginBottom: "0.25rem" },
  statLabel: {
    fontSize: "0.68rem", color: "#4a5568", letterSpacing: "0.1em",
    textTransform: "uppercase", fontFamily: "'Share Tech Mono', monospace",
  },
  tabs: {
    display: "flex", gap: 8, padding: "0 2rem 1rem",
    position: "relative", zIndex: 1,
  },
  tab: {
    padding: "0.5rem 1.25rem", border: "1px solid #1e2d4a", borderRadius: 8,
    background: "transparent", color: "#6b7280", cursor: "pointer",
    fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem",
    fontWeight: 500, letterSpacing: "0.05em", display: "flex",
    alignItems: "center", gap: 6,
  },
  tabActive: {
    background: "rgba(0,212,255,0.08)", color: "#00d4ff",
    borderColor: "rgba(0,212,255,0.3)",
  },
  badge: {
    background: "#f87171", color: "#fff", borderRadius: "50%",
    width: 18, height: 18, fontSize: "0.7rem", display: "inline-flex",
    alignItems: "center", justifyContent: "center",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12, padding: "0 2rem", position: "relative", zIndex: 1,
  },
  pcCard: {
    background: "#0f1525", border: "1px solid #1e2d4a", borderRadius: 12, padding: "1rem",
  },
  pcHeader: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" },
  pcIcon: {
    width: 36, height: 36, borderRadius: 8, background: "#141929",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  pcName: { fontWeight: 500, fontSize: "0.95rem", margin: 0, color: "#e2e8f0" },
  pcIp: {
    fontSize: "0.7rem", color: "#4a5568", margin: 0,
    fontFamily: "'Share Tech Mono', monospace",
  },
  statusBadge: {
    padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.7rem",
    letterSpacing: "0.08em", textTransform: "uppercase",
    fontFamily: "'Share Tech Mono', monospace", flexShrink: 0,
  },
  specs: { display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.75rem" },
  spec: {
    fontSize: "0.68rem", color: "#4a5568", background: "#141929",
    padding: "0.2rem 0.5rem", borderRadius: 4,
    fontFamily: "'Share Tech Mono', monospace",
  },
  pcFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  pcRate: { fontSize: "0.8rem", color: "#10b981", fontFamily: "'Share Tech Mono', monospace" },
  pcActions: { display: "flex", gap: 4 },
  actionBtn: {
    padding: "0.25rem 0.5rem", border: "none", background: "transparent",
    cursor: "pointer", fontSize: "0.72rem", fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: "0.05em",
  },
  tableWrap: {
    padding: "0 2rem", overflowX: "auto", position: "relative", zIndex: 1,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem",
    color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase",
    fontFamily: "'Share Tech Mono', monospace",
    borderBottom: "1px solid #1e2d4a",
  },
  tr: { borderBottom: "1px solid #141929" },
  td: { padding: "0.85rem 1rem" },
  username: {
    color: "#a78bfa", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.85rem",
  },
  pcTag: {
    background: "rgba(0,212,255,0.08)", color: "#00d4ff",
    border: "1px solid rgba(0,212,255,0.2)", padding: "0.2rem 0.5rem",
    borderRadius: 4, fontSize: "0.78rem", fontFamily: "'Share Tech Mono', monospace",
  },
  muted: { color: "#4a5568", fontSize: "0.8rem", fontFamily: "'Share Tech Mono', monospace" },
  timer: { fontFamily: "'Share Tech Mono', monospace", fontWeight: 600, fontSize: "1rem" },
  sessionActions: { display: "flex", gap: 4 },
  iconBtn: {
    padding: "0.3rem 0.6rem", border: "1px solid currentColor", borderRadius: 5,
    background: "transparent", cursor: "pointer", fontSize: "0.75rem",
    fontFamily: "'Share Tech Mono', monospace", opacity: 0.8,
  },
  requestList: { padding: "0 2rem", display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 },
  requestCard: {
    background: "#0f1525", border: "1px solid #1e2d4a", borderRadius: 10,
    padding: "1rem 1.25rem", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "1rem",
  },
  requestLeft: { display: "flex", flexDirection: "column", gap: 4 },
  requestType: {
    fontWeight: 600, fontSize: "0.9rem", color: "#e2e8f0",
    textTransform: "capitalize", letterSpacing: "0.05em",
  },
  requestMeta: { display: "flex", gap: "0.75rem", alignItems: "center" },
  requestDetails: {
    fontSize: "0.72rem", color: "#4a5568",
    fontFamily: "'Share Tech Mono', monospace", margin: 0,
  },
  requestBtns: { display: "flex", gap: 6, flexShrink: 0 },
  approveBtn: {
    padding: "0.4rem 0.9rem", border: "1px solid rgba(16,185,129,0.4)",
    borderRadius: 6, background: "rgba(16,185,129,0.08)", color: "#10b981",
    cursor: "pointer", fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.85rem", fontWeight: 500,
  },
  rejectBtn: {
    padding: "0.4rem 0.9rem", border: "1px solid rgba(248,113,113,0.4)",
    borderRadius: 6, background: "rgba(248,113,113,0.08)", color: "#f87171",
    cursor: "pointer", fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.85rem", fontWeight: 500,
  },
};

export default AdminDashboard;
