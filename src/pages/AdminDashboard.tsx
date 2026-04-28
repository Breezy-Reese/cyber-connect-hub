// src/pages/AdminDashboard.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
interface User {
  _id: string;
  username: string;
  email?: string;
  role: "client" | "admin";
  is_online: boolean;
  last_login?: string;
  created_at: string;
  active_session?: { computer_name: string; start_time: string; remaining_time: number } | null;
  total_sessions?: number;
  total_spent?: number;
}
interface PrintJob {
  _id: string;
  user: { _id: string; username: string };
  file_name: string;
  file_path?: string;
  file_size?: number;
  copies: number;
  color: boolean;
  pages: number;
  cost: number;
  status: "pending" | "printing" | "completed" | "failed" | "cancelled";
  created_at: string;
  printer_name?: string;
}
interface Message {
  _id: string;
  from: { _id: string; username: string; role: string };
  text: string;
  role: "client" | "admin";
  created_at: string;
  read: boolean;
}

const fmt = (secs: number) => {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
};
const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
const statusColor: Record<string, string> = {
  available: "#10b981", in_use: "#00d4ff", maintenance: "#f59e0b", offline: "#6b7280",
};
const statusBg: Record<string, string> = {
  available: "rgba(16,185,129,0.1)", in_use: "rgba(0,212,255,0.1)",
  maintenance: "rgba(245,158,11,0.1)", offline: "rgba(107,114,128,0.1)",
};
const printStatusColor: Record<string, string> = {
  pending: "#f59e0b", printing: "#00d4ff", completed: "#10b981", failed: "#f87171", cancelled: "#6b7280",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token, user: adminUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [computers, setComputers] = useState<Computer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"computers" | "sessions" | "requests" | "users" | "print" | "messages">("computers");
  const [tick, setTick] = useState(0);

  // User tab state
  const [userFilter, setUserFilter] = useState<"all" | "online" | "offline">("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Messages state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const safeJson = async (res: Response) => {
    if (!res.ok) return null;
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users`, { headers });
      if (!res.ok) return;
      const data = await safeJson(res);
      if (data !== null) setUsers(data.users || data || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchPrintJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/print-jobs`, { headers });
      if (!res.ok) return;
      const data = await safeJson(res);
      if (data !== null) setPrintJobs(data.jobs || data || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/messages`, { headers });
      if (!res.ok) return;
      const data = await safeJson(res);
      if (data !== null) setMessages(data.messages || data || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchAll = useCallback(async () => {
    try {
      const [compRes, sessRes, reqRes] = await Promise.all([
        fetch(`${API}/computers`, { headers }),
        fetch(`${API}/sessions/active`, { headers }),
        fetch(`${API}/requests/pending`, { headers }),
      ]);
      const [comp, sess, req] = await Promise.all([
        safeJson(compRes), safeJson(sessRes), safeJson(reqRes),
      ]);
      if (comp !== null) setComputers(comp.computers || comp || []);
      if (sess !== null) setSessions(sess.sessions || sess || []);
      if (req !== null) setRequests(req.requests || req || []);
      const activeSessions = sess ? (sess.sessions || sess || []) : [];
      const total = activeSessions.reduce((sum: number, s: Session) => sum + (s.total_cost || 0), 0);
      setEarnings(total);
    } catch (e) { console.error("Fetch error:", e); }
    finally { setLoading(false); }
    fetchUsers();
    fetchPrintJobs();
    fetchMessages();
  }, [token, fetchUsers, fetchPrintJobs, fetchMessages]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(fetchAll, 30000); return () => clearInterval(id); }, [fetchAll]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  const fetchConversation = async (userId: string) => {
    try {
      const res = await fetch(`${API}/messages/conversation/${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConversation(data.messages || []);
        // Mark as read
        await fetch(`${API}/messages/read/${userId}`, { method: "PATCH", headers });
        fetchMessages();
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectClient = (userId: string) => {
    setSelectedClientId(userId);
    fetchConversation(userId);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedClientId) return;
    setReplying(true);
    try {
      const res = await fetch(`${API}/messages/reply/${selectedClientId}`, {
        method: "POST", headers,
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        fetchConversation(selectedClientId);
      }
    } catch (e) { console.error(e); }
    setReplying(false);
  };

  const handleRequest = async (id: string, action: "approved" | "rejected") => {
    await fetch(`${API}/requests/${id}/${action}`, { method: "PATCH", headers });
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };
  const addTime = async (sessionId: string, minutes: number) => {
    await fetch(`${API}/sessions/${sessionId}/add-time`, { method: "POST", headers, body: JSON.stringify({ minutes }) });
    fetchAll();
  };
  const endSession = async (sessionId: string) => {
    if (!confirm("End this session?")) return;
    await fetch(`${API}/sessions/${sessionId}/end`, { method: "POST", headers });
    fetchAll();
  };
  const updateComputerStatus = async (id: string, status: string) => {
    await fetch(`${API}/computers/${id}`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    fetchAll();
  };
  const kickUser = async (userId: string) => {
    if (!confirm("Force logout this user?")) return;
    await fetch(`${API}/users/${userId}/kick`, { method: "POST", headers });
    fetchAll();
  };
  const updatePrintJobStatus = async (jobId: string, status: string) => {
    await fetch(`${API}/print-jobs/${jobId}`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    fetchPrintJobs();
  };
  const handleLogout = () => { logout(); navigate("/"); };

  const available = computers.filter((c) => c.status === "available").length;
  const inUse = computers.filter((c) => c.status === "in_use").length;
  const maintenance = computers.filter((c) => c.status === "maintenance").length;
  const onlineUsers = users.filter((u) => u.is_online).length;
  const pendingPrintJobs = printJobs.filter((j) => j.status === "pending").length;
  const unreadMessages = messages.filter((m) => !m.read && m.role === "client").length;

  // Group messages by sender for inbox view
  const messagesByClient = messages.reduce((acc, msg) => {
    if (msg.role !== "client") return acc;
    const uid = msg.from._id;
    if (!acc[uid]) acc[uid] = { user: msg.from, messages: [], latest: msg };
    acc[uid].messages.push(msg);
    if (new Date(msg.created_at) > new Date(acc[uid].latest.created_at)) acc[uid].latest = msg;
    return acc;
  }, {} as Record<string, { user: Message["from"]; messages: Message[]; latest: Message }>);

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
    const matchFilter = userFilter === "all" ? true : userFilter === "online" ? u.is_online : !u.is_online;
    return matchSearch && matchFilter;
  });

  const C = isDark ? DARK : LIGHT;

  if (loading) return (
    <div style={{ ...S.page, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={S.loader}>
        <div style={{ ...S.loaderDot, background: C.primary }} />
        <span style={{ ...S.loaderText, color: C.muted }}>Loading admin panel...</span>
      </div>
    </div>
  );

  return (
    <div style={{ ...S.page, background: C.bg, color: C.text }}>
      <div style={S.scanlines} />

      {/* Header */}
      <header style={{ ...S.header, background: C.surface, borderBottomColor: C.border }}>
        <div style={S.headerLeft}>
          <div style={{ ...S.headerIcon, background: C.primaryBg, borderColor: C.primaryBorder }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <h1 style={{ ...S.headerTitle, color: C.primary }}>SHINESTAR ADMIN</h1>
            <p style={{ ...S.headerSub, color: C.muted }}>Management Console</p>
          </div>
        </div>
        <div style={S.headerRight}>
          <div style={{ ...S.liveIndicator, color: C.success }}>
            <span style={{ ...S.liveDot, background: C.success }} />LIVE
          </div>
          <button onClick={toggleTheme} style={{ ...S.themeBtn, border: `1px solid ${C.border}`, color: C.text2 }}>
            {isDark ? "☀ Light" : "🌙 Dark"}
          </button>
          <button onClick={handleLogout} style={{ ...S.logoutBtn, borderColor: C.border, color: C.muted }}>⏻ Logout</button>
        </div>
      </header>

      {/* Stats */}
      <div style={S.statsGrid}>
        {[
          { label: "Total PCs", value: computers.length, color: C.primary, icon: "🖥" },
          { label: "In Use", value: inUse, color: "#a78bfa", icon: "⚡" },
          { label: "Available", value: available, color: C.success, icon: "✓" },
          { label: "Maintenance", value: maintenance, color: C.warning, icon: "⚙" },
          { label: "Online Users", value: onlineUsers, color: C.primary, icon: "👤" },
          { label: "Pending", value: requests.length, color: C.danger, icon: "!" },
          { label: "Print Jobs", value: pendingPrintJobs, color: C.warning, icon: "🖨" },
          { label: "Earnings", value: `KSh ${earnings.toFixed(2)}`, color: C.success, icon: "KSh" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, background: C.surface, borderColor: C.border }}>
            <div style={{ ...S.statIcon, color: s.color }}>{s.icon}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
            <div style={{ ...S.statLabel, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {([
          { key: "computers", icon: "🖥" },
          { key: "sessions", icon: "⏱" },
          { key: "requests", icon: "📋" },
          { key: "users", icon: "👥" },
          { key: "print", icon: "🖨" },
          { key: "messages", icon: "💬" },
        ] as const).map(({ key, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              ...S.tab, borderColor: C.border,
              color: activeTab === key ? C.primary : C.muted,
              background: activeTab === key ? C.primaryBg : "transparent",
              ...(activeTab === key ? { borderColor: C.primaryBorder } : {}),
            }}>
            {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
            {key === "requests" && requests.length > 0 && <span style={S.badge}>{requests.length}</span>}
            {key === "users" && onlineUsers > 0 && <span style={{ ...S.badge, background: C.success }}>{onlineUsers}</span>}
            {key === "print" && pendingPrintJobs > 0 && <span style={{ ...S.badge, background: C.warning }}>{pendingPrintJobs}</span>}
            {key === "messages" && unreadMessages > 0 && <span style={{ ...S.badge, background: C.primary }}>{unreadMessages}</span>}
          </button>
        ))}
      </div>

      {/* ── COMPUTERS ── */}
      {activeTab === "computers" && (
        <div style={S.grid}>
          {computers.length === 0 && <EmptyState text="No computers registered" color={C.muted} />}
          {computers.map((pc) => (
            <div key={pc._id} style={{ ...S.pcCard, background: C.surface, borderColor: C.border }}>
              <div style={S.pcHeader}>
                <div style={{ ...S.pcIcon, background: C.surface2 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={statusColor[pc.status]} strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ ...S.pcName, color: C.text }}>{pc.computer_name}</p>
                  {pc.ip_address && <p style={{ ...S.pcIp, color: C.muted }}>{pc.ip_address}</p>}
                </div>
                <div style={{ ...S.statusBadge, color: statusColor[pc.status], background: statusBg[pc.status], border: `1px solid ${statusColor[pc.status]}44` }}>
                  {pc.status.replace("_", " ")}
                </div>
              </div>
              {pc.specifications && (
                <div style={S.specs}>
                  {pc.specifications.processor && <span style={{ ...S.spec, background: C.surface2, color: C.muted }}>CPU: {pc.specifications.processor}</span>}
                  {pc.specifications.ram && <span style={{ ...S.spec, background: C.surface2, color: C.muted }}>RAM: {pc.specifications.ram}</span>}
                  {pc.specifications.os && <span style={{ ...S.spec, background: C.surface2, color: C.muted }}>OS: {pc.specifications.os}</span>}
                </div>
              )}
              <div style={S.pcFooter}>
                <span style={{ ...S.pcRate, color: C.success }}>KSh {pc.hourly_rate.toFixed(2)}/hr</span>
                <div style={S.pcActions}>
                  {pc.status !== "available" && <button style={{ ...S.actionBtn, color: C.success }} onClick={() => updateComputerStatus(pc._id, "available")}>Set Available</button>}
                  {pc.status !== "maintenance" && <button style={{ ...S.actionBtn, color: C.warning }} onClick={() => updateComputerStatus(pc._id, "maintenance")}>Maintenance</button>}
                  {pc.status !== "offline" && <button style={{ ...S.actionBtn, color: C.muted }} onClick={() => updateComputerStatus(pc._id, "offline")}>Offline</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SESSIONS ── */}
      {activeTab === "sessions" && (
        <div style={S.tableWrap}>
          {sessions.length === 0 && <EmptyState text="No active sessions" color={C.muted} />}
          {sessions.length > 0 && (
            <table style={S.table}>
              <thead>
                <tr>{["User", "PC", "Started", "Remaining", "Cost", "Actions"].map((h) => (
                  <th key={h} style={{ ...S.th, color: C.muted, borderBottomColor: C.border }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const remaining = Math.max(0, s.remaining_time - tick);
                  const elapsed = Math.floor((Date.now() - new Date(s.start_time).getTime()) / 1000);
                  const cost = (elapsed / 3600) * s.hourly_rate_at_start;
                  return (
                    <tr key={s._id} style={{ ...S.tr, borderBottomColor: C.surface2 }}>
                      <td style={S.td}><span style={{ color: "#a78bfa", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.85rem" }}>{s.user?.username || "Guest"}</span></td>
                      <td style={S.td}><span style={{ background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBorder}`, padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.78rem", fontFamily: "'Share Tech Mono',monospace" }}>{s.computer?.computer_name || "—"}</span></td>
                      <td style={S.td}><span style={{ color: C.muted, fontSize: "0.8rem", fontFamily: "'Share Tech Mono',monospace" }}>{new Date(s.start_time).toLocaleTimeString()}</span></td>
                      <td style={S.td}><span style={{ fontFamily: "'Share Tech Mono',monospace", fontWeight: 600, fontSize: "1rem", color: remaining < 300 ? C.danger : C.primary }}>{fmt(remaining)}</span></td>
                      <td style={S.td}><span style={{ color: C.success, fontFamily: "monospace" }}>KSh {cost.toFixed(2)}</span></td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={{ ...S.iconBtn, color: C.success }} onClick={() => addTime(s._id, 30)}>+30m</button>
                          <button style={{ ...S.iconBtn, color: C.warning }} onClick={() => addTime(s._id, 60)}>+1hr</button>
                          <button style={{ ...S.iconBtn, color: C.danger }} onClick={() => endSession(s._id)}>End</button>
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

      {/* ── USERS ── */}
      {activeTab === "users" && (
        <div style={{ padding: "0 2rem", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search by username or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 1rem 0.55rem 2.1rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: "0.85rem", fontFamily: "'Share Tech Mono',monospace", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "online", "offline"] as const).map((f) => (
                <button key={f} onClick={() => setUserFilter(f)}
                  style={{ padding: "0.45rem 0.9rem", border: `1px solid ${userFilter === f ? C.primaryBorder : C.border}`, borderRadius: 8, background: userFilter === f ? C.primaryBg : "transparent", color: userFilter === f ? C.primary : C.muted, cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.06em" }}>
                  {f === "online" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.success, marginRight: 5 }} />}
                  {f === "offline" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.muted, marginRight: 5 }} />}
                  {f.toUpperCase()} {f === "online" ? `(${onlineUsers})` : f === "offline" ? `(${users.length - onlineUsers})` : `(${users.length})`}
                </button>
              ))}
            </div>
          </div>
          {filteredUsers.length === 0 && <EmptyState text="No users found" color={C.muted} />}
          {filteredUsers.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>{["Status", "Username", "Email", "Role", "Active Session", "Last Login", "Total Sessions", "Spent", "Actions"].map((h) => (
                    <th key={h} style={{ ...S.th, color: C.muted, borderBottomColor: C.border }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} style={{ ...S.tr, borderBottomColor: C.surface2, cursor: "pointer" }} onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}>
                      <td style={{ ...S.td, textAlign: "center" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: u.is_online ? C.success : C.muted, boxShadow: u.is_online ? `0 0 6px ${C.success}` : "none" }} /></td>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: u.is_online ? "rgba(0,212,255,0.12)" : C.surface2, border: `1px solid ${u.is_online ? C.primaryBorder : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 600, color: u.is_online ? C.primary : C.muted, fontFamily: "'Share Tech Mono',monospace", flexShrink: 0 }}>
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ color: u.is_online ? C.text : C.text2, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.85rem" }}>{u.username}</span>
                        </div>
                      </td>
                      <td style={S.td}><span style={{ color: C.muted, fontSize: "0.8rem", fontFamily: "'Share Tech Mono',monospace" }}>{u.email || "—"}</span></td>
                      <td style={S.td}><span style={{ padding: "0.18rem 0.55rem", borderRadius: 5, fontSize: "0.68rem", letterSpacing: "0.08em", fontFamily: "'Share Tech Mono',monospace", background: u.role === "admin" ? "rgba(124,58,237,0.12)" : C.surface2, color: u.role === "admin" ? "#a78bfa" : C.muted, border: `1px solid ${u.role === "admin" ? "rgba(124,58,237,0.3)" : C.border}` }}>{u.role.toUpperCase()}</span></td>
                      <td style={S.td}>
                        {u.active_session ? (
                          <div>
                            <div style={{ background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBorder}`, padding: "0.18rem 0.5rem", borderRadius: 4, fontSize: "0.75rem", fontFamily: "'Share Tech Mono',monospace", display: "inline-block" }}>{u.active_session.computer_name}</div>
                            <div style={{ color: C.success, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.72rem", marginTop: 2 }}>⏱ {fmt(u.active_session.remaining_time)}</div>
                          </div>
                        ) : <span style={{ color: C.muted, fontSize: "0.78rem", fontFamily: "'Share Tech Mono',monospace" }}>—</span>}
                      </td>
                      <td style={S.td}><span style={{ color: C.muted, fontSize: "0.78rem", fontFamily: "'Share Tech Mono',monospace" }}>{u.last_login ? timeAgo(u.last_login) : "Never"}</span></td>
                      <td style={S.td}><span style={{ color: C.text2, fontFamily: "monospace", fontSize: "0.85rem" }}>{u.total_sessions ?? 0}</span></td>
                      <td style={S.td}><span style={{ color: C.success, fontFamily: "monospace", fontSize: "0.85rem" }}>KSh {(u.total_spent ?? 0).toFixed(2)}</span></td>
                      <td style={S.td} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {u.is_online && u.role !== "admin" && <button style={{ ...S.iconBtn, color: C.danger }} onClick={() => kickUser(u._id)}>Kick</button>}
                          <button style={{ ...S.iconBtn, color: C.primary }} onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}>{selectedUser?._id === u._id ? "Hide" : "View"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedUser && (
            <div style={{ marginTop: "1.25rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.25rem", borderLeft: `3px solid ${selectedUser.is_online ? C.primary : C.muted}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: selectedUser.is_online ? C.primaryBg : C.surface2, border: `2px solid ${selectedUser.is_online ? C.primary : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 600, color: selectedUser.is_online ? C.primary : C.muted, fontFamily: "'Share Tech Mono',monospace" }}>
                    {selectedUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: C.text }}>{selectedUser.username}</div>
                    <div style={{ fontSize: "0.75rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace" }}>{selectedUser.email || "No email"} · Joined {new Date(selectedUser.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                {[
                  { label: "Status", value: selectedUser.is_online ? "● Online" : "○ Offline", color: selectedUser.is_online ? C.success : C.muted },
                  { label: "Role", value: selectedUser.role.toUpperCase(), color: selectedUser.role === "admin" ? "#a78bfa" : C.text2 },
                  { label: "Last Login", value: selectedUser.last_login ? timeAgo(selectedUser.last_login) : "Never", color: C.text2 },
                  { label: "Total Sessions", value: String(selectedUser.total_sessions ?? 0), color: C.primary },
                  { label: "Total Spent", value: `KSh ${(selectedUser.total_spent ?? 0).toFixed(2)}`, color: C.success },
                  { label: "Active PC", value: selectedUser.active_session?.computer_name || "None", color: selectedUser.active_session ? C.primary : C.muted },
                ].map((item) => (
                  <div key={item.label} style={{ background: C.surface2, borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.65rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: item.color, fontFamily: "'Share Tech Mono',monospace" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS ── */}
      {activeTab === "requests" && (
        <div style={S.requestList}>
          {requests.length === 0 && <EmptyState text="No pending requests" color={C.muted} />}
          {requests.map((r) => (
            <div key={r._id} style={{ ...S.requestCard, background: C.surface, borderColor: C.border }}>
              <div style={S.requestLeft}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: C.text, textTransform: "capitalize", letterSpacing: "0.05em" }}>
                  {r.type === "print" && "🖨"}{r.type === "time_extension" && "⏱"}{r.type === "assistance" && "🆘"}
                  {r.type === "food" && "🍔"}{r.type === "drink" && "☕"}{r.type === "service" && "🔧"}
                  {" "}{r.type.replace("_", " ")}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ color: "#a78bfa", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.85rem" }}>{r.user?.username}</span>
                  <span style={{ color: C.muted, fontSize: "0.8rem", fontFamily: "'Share Tech Mono',monospace" }}>{new Date(r.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button style={S.approveBtn} onClick={() => handleRequest(r._id, "approved")}>✓ Approve</button>
                <button style={S.rejectBtn} onClick={() => handleRequest(r._id, "rejected")}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PRINT JOBS ── */}
      {activeTab === "print" && (
        <div style={{ padding: "0 2rem", position: "relative", zIndex: 1 }}>
          {printJobs.length === 0 && <EmptyState text="No print jobs submitted" color={C.muted} />}
          {printJobs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {printJobs.map((job) => (
                <div key={job._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${printStatusColor[job.status]}18`, border: `1px solid ${printStatusColor[job.status]}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>🖨</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: C.text, fontFamily: "'Share Tech Mono',monospace", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.file_name}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.72rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace" }}>👤 {job.user?.username}</span>
                        <span style={{ fontSize: "0.72rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace" }}>📄 {job.pages}p × {job.copies}</span>
                        <span style={{ fontSize: "0.72rem", color: job.color ? "#f59e0b" : C.muted, fontFamily: "'Share Tech Mono',monospace" }}>{job.color ? "🎨 Color" : "⬛ B&W"}</span>
                        <span style={{ fontSize: "0.72rem", color: C.success, fontFamily: "'Share Tech Mono',monospace" }}>KSh {job.cost.toFixed(2)}</span>
                        <span style={{ fontSize: "0.72rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace" }}>{timeAgo(job.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem", borderRadius: 6, fontFamily: "'Share Tech Mono',monospace", background: `${printStatusColor[job.status]}18`, color: printStatusColor[job.status], border: `1px solid ${printStatusColor[job.status]}44`, letterSpacing: "0.06em" }}>
                      {job.status.toUpperCase()}
                    </span>
                    {job.status === "pending" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={{ ...S.iconBtn, color: C.primary }} onClick={() => updatePrintJobStatus(job._id, "printing")}>🖨 Print</button>
                        <button style={{ ...S.iconBtn, color: C.success }} onClick={() => updatePrintJobStatus(job._id, "completed")}>✓ Done</button>
                        <button style={{ ...S.iconBtn, color: C.danger }} onClick={() => updatePrintJobStatus(job._id, "failed")}>✕ Fail</button>
                      </div>
                    )}
                    {job.status === "printing" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={{ ...S.iconBtn, color: C.success }} onClick={() => updatePrintJobStatus(job._id, "completed")}>✓ Done</button>
                        <button style={{ ...S.iconBtn, color: C.danger }} onClick={() => updatePrintJobStatus(job._id, "failed")}>✕ Fail</button>
                      </div>
                    )}
                    {job.file_path && (
                      <a href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}/uploads/print/${job.file_path.split(/[\\/]/).pop()}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ ...S.iconBtn, color: C.warning, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                        ⬇ Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MESSAGES ── */}
      {activeTab === "messages" && (
        <div style={{ padding: "0 2rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, position: "relative", zIndex: 1, alignItems: "start" }}>

          {/* Inbox sidebar */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${C.border}`, fontSize: "0.7rem", color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace" }}>
              Client Inbox {unreadMessages > 0 && <span style={{ ...S.badge, marginLeft: 6, background: C.primary }}>{unreadMessages}</span>}
            </div>
            {Object.keys(messagesByClient).length === 0
              ? <div style={{ padding: "2rem 1rem", textAlign: "center", color: C.muted, fontSize: "0.8rem", fontFamily: "'Share Tech Mono',monospace" }}>No messages yet</div>
              : Object.values(messagesByClient).map(({ user: msgUser, latest, messages: msgs }) => {
                  const unread = msgs.filter((m) => !m.read).length;
                  const isSelected = selectedClientId === msgUser._id;
                  return (
                    <div key={msgUser._id}
                      onClick={() => handleSelectClient(msgUser._id)}
                      style={{ padding: "0.85rem 1rem", cursor: "pointer", borderBottom: `1px solid ${C.border}`, background: isSelected ? C.primaryBg : "transparent", borderLeft: isSelected ? `3px solid ${C.primary}` : "3px solid transparent", transition: "all 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isSelected ? C.primary : C.text, fontFamily: "'Share Tech Mono',monospace" }}>{msgUser.username}</span>
                        {unread > 0 && <span style={{ ...S.badge, background: C.primary, width: "auto", padding: "0 5px", borderRadius: 8 }}>{unread}</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latest.text}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace" }}>{timeAgo(latest.created_at)}</p>
                    </div>
                  );
                })}
          </div>

          {/* Conversation panel */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", flexDirection: "column", minHeight: 450 }}>
            {!selectedClientId
              ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.85rem", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: "2rem" }}>💬</span>
                  <span>Select a client to view conversation</span>
                </div>
              : <>
                  <div style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${C.border}`, fontSize: "0.8rem", color: C.text, fontFamily: "'Share Tech Mono',monospace", fontWeight: 600 }}>
                    💬 {messagesByClient[selectedClientId]?.user.username || "Client"}
                  </div>
                  <div style={{ flex: 1, padding: "1rem", overflowY: "auto", maxHeight: 360, display: "flex", flexDirection: "column", gap: 8 }}>
                    {conversation.map((msg, i) => {
                      const isAdmin = msg.role === "admin";
                      return (
                        <div key={msg._id || i} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                          <span style={{ fontSize: "0.65rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace", marginBottom: 2 }}>
                            {isAdmin ? "You (admin)" : msg.from.username}
                          </span>
                          <div style={{ maxWidth: "75%", padding: "0.6rem 0.9rem", borderRadius: 10, fontSize: "0.88rem", lineHeight: 1.4, background: isAdmin ? C.primaryBg : C.surface2, border: `1px solid ${isAdmin ? C.primaryBorder : C.border}`, color: isAdmin ? C.primary : C.text }}>
                            {msg.text}
                            <div style={{ fontSize: "0.62rem", opacity: 0.5, fontFamily: "'Share Tech Mono',monospace", marginTop: 3, textAlign: "right" }}>{new Date(msg.created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={sendReply} style={{ padding: "0.85rem 1rem", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                    <input
                      style={{ flex: 1, padding: "0.6rem 0.9rem", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.88rem", outline: "none" }}
                      placeholder="Type a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button type="submit" disabled={replying || !replyText.trim()}
                      style={{ padding: "0.6rem 1.1rem", background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, borderRadius: 8, color: C.primary, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.9rem", fontWeight: 600, opacity: replying || !replyText.trim() ? 0.5 : 1 }}>
                      Reply →
                    </button>
                  </form>
                </>}
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ text, color }: { text: string; color: string }) => (
  <div style={{ textAlign: "center", padding: "3rem", color, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
    <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.4 }}>◌</div>{text}
  </div>
);

const DARK = {
  bg: "#0a0e1a", surface: "#0f1525", surface2: "#141929", border: "#1e2d4a",
  primary: "#00d4ff", primaryBg: "rgba(0,212,255,0.08)", primaryBorder: "rgba(0,212,255,0.3)",
  text: "#e2e8f0", text2: "#94a3b8", muted: "#4a5568",
  success: "#10b981", warning: "#f59e0b", danger: "#f87171",
};
const LIGHT = {
  bg: "#f0f4f8", surface: "#ffffff", surface2: "#f1f5f9", border: "#e2e8f0",
  primary: "#0284c7", primaryBg: "rgba(2,132,199,0.08)", primaryBorder: "rgba(2,132,199,0.3)",
  text: "#0f172a", text2: "#475569", muted: "#94a3b8",
  success: "#059669", warning: "#d97706", danger: "#dc2626",
};

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", fontFamily: "'Rajdhani','Segoe UI',sans-serif", padding: "0 0 3rem", position: "relative" },
  scanlines: { position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)", pointerEvents: "none", zIndex: 0 },
  loader: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" },
  loaderDot: { width: 12, height: 12, borderRadius: "50%" },
  loaderText: { fontFamily: "'Share Tech Mono',monospace", fontSize: "0.8rem", letterSpacing: "0.15em" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid", position: "relative", zIndex: 1 },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  headerIcon: { width: 42, height: 42, borderRadius: 10, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: "1.2rem", fontWeight: 600, letterSpacing: "0.15em", margin: 0 },
  headerSub: { fontSize: "0.68rem", letterSpacing: "0.15em", fontFamily: "'Share Tech Mono',monospace", margin: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  liveIndicator: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", letterSpacing: "0.15em", fontFamily: "'Share Tech Mono',monospace" },
  liveDot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block" },
  themeBtn: { padding: "0.4rem 0.85rem", border: "1px solid", borderRadius: 6, background: "transparent", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.75rem", letterSpacing: "0.05em", transition: "all 0.2s" },
  logoutBtn: { padding: "0.4rem 0.9rem", border: "1px solid", borderRadius: 6, background: "transparent", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.85rem", letterSpacing: "0.05em" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, padding: "1.5rem 2rem", position: "relative", zIndex: 1 },
  statCard: { border: "1px solid", borderRadius: 12, padding: "1rem", textAlign: "center" },
  statIcon: { fontSize: "1.2rem", marginBottom: "0.5rem" },
  statValue: { fontSize: "1.8rem", fontWeight: 600, lineHeight: 1, marginBottom: "0.25rem" },
  statLabel: { fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace" },
  tabs: { display: "flex", gap: 8, padding: "0 2rem 1rem", position: "relative", zIndex: 1, flexWrap: "wrap" },
  tab: { padding: "0.5rem 1.25rem", border: "1px solid", borderRadius: 8, background: "transparent", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 },
  badge: { background: "#f87171", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.7rem", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, padding: "0 2rem", position: "relative", zIndex: 1 },
  pcCard: { border: "1px solid", borderRadius: 12, padding: "1rem" },
  pcHeader: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" },
  pcIcon: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pcName: { fontWeight: 500, fontSize: "0.95rem", margin: 0 },
  pcIp: { fontSize: "0.7rem", margin: 0, fontFamily: "'Share Tech Mono',monospace" },
  statusBadge: { padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", flexShrink: 0 },
  specs: { display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.75rem" },
  spec: { fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: 4, fontFamily: "'Share Tech Mono',monospace" },
  pcFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  pcRate: { fontSize: "0.8rem", fontFamily: "'Share Tech Mono',monospace" },
  pcActions: { display: "flex", gap: 4 },
  actionBtn: { padding: "0.25rem 0.5rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.05em" },
  tableWrap: { padding: "0 2rem", overflowX: "auto", position: "relative", zIndex: 1 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", borderBottom: "1px solid" },
  tr: { borderBottom: "1px solid" },
  td: { padding: "0.85rem 1rem" },
  iconBtn: { padding: "0.3rem 0.6rem", border: "1px solid currentColor", borderRadius: 5, background: "transparent", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Share Tech Mono',monospace", opacity: 0.8 },
  requestList: { padding: "0 2rem", display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 },
  requestCard: { border: "1px solid", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" },
  requestLeft: { display: "flex", flexDirection: "column", gap: 4 },
  approveBtn: { padding: "0.4rem 0.9rem", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 6, background: "rgba(16,185,129,0.08)", color: "#10b981", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.85rem", fontWeight: 500 },
  rejectBtn: { padding: "0.4rem 0.9rem", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, background: "rgba(248,113,113,0.08)", color: "#f87171", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.85rem", fontWeight: 500 },
};

export default AdminDashboard;
