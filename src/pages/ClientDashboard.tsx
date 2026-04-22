// src/pages/ClientDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Session {
  _id: string;
  remaining_time: number;
  total_cost: number;
  hourly_rate_at_start: number;
  start_time: string;
  status: string;
  computer: { computer_name: string; hourly_rate: number };
}
interface Request { _id: string; type: string; status: string; created_at: string; }
interface Message { from: "client" | "admin"; text: string; time: string; }

const fmt = (secs: number) => {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
};

const services = [
  { type: "print", icon: "🖨", label: "Print", desc: "Print documents" },
  { type: "scan", icon: "📄", label: "Scan", desc: "Scan documents" },
  { type: "time_extension", icon: "⏱", label: "Add Time", desc: "Extend your session" },
  { type: "assistance", icon: "🆘", label: "Help", desc: "Get assistance" },
  { type: "food", icon: "🍔", label: "Food", desc: "Order snacks" },
  { type: "drink", icon: "☕", label: "Drinks", desc: "Order beverages" },
];

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

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const C = isDark ? DARK : LIGHT;

  const [session, setSession] = useState<Session | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview"|"services"|"chat">("overview");
  const [sending, setSending] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sessions/my`, { headers });
      if (res.status === 404) {
        setSession(null);
      } else if (res.ok) {
        const data = await res.json();
        const s = data.session || data;
        setSession(s);
        setRemaining(s.remaining_time);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API}/requests/my`, { headers });
      if (res.ok) { const data = await res.json(); setRequests(data.requests || data || []); }
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { fetchSession(); fetchRequests(); }, [fetchSession, fetchRequests]);
  useEffect(() => { if (!session) return; const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000); return () => clearInterval(id); }, [session]);

  const sendRequest = async (type: string) => {
    try {
      const res = await fetch(`${API}/requests`, { method: "POST", headers, body: JSON.stringify({ type, sessionId: session?._id }) });
      if (res.ok) fetchRequests();
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    setMessages((prev) => [...prev, { from: "client", text: newMessage, time: new Date().toLocaleTimeString() }]);
    setNewMessage("");
    setSending(false);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const elapsed = session ? Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000) : 0;
  const cost = session ? (elapsed / 3600) * session.hourly_rate_at_start : 0;
  const pct = session ? Math.min(100, (remaining / session.remaining_time) * 100) : 0;
  const isLow = remaining < 300 && remaining > 0;

  const reqColor = (status: string) => ({
    color: status === "approved" ? C.success : status === "rejected" ? C.danger : C.warning,
    borderColor: status === "approved" ? `${C.success}44` : status === "rejected" ? `${C.danger}44` : `${C.warning}44`,
    background: status === "approved" ? `${C.success}11` : status === "rejected" ? `${C.danger}11` : `${C.warning}11`,
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Rajdhani','Segoe UI',sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)" }} />

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "0.15em", color: C.primary, margin: 0 }}>SHINESTAR</h1>
            <p style={{ fontSize: "0.68rem", color: C.muted, letterSpacing: "0.1em", fontFamily: "'Share Tech Mono',monospace", margin: 0 }}>
              {session ? session.computer?.computer_name || "PC" : "No active session"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: C.text2, fontFamily: "'Share Tech Mono',monospace" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block" }} />
            {user?.username}
          </div>
          <button onClick={toggleTheme} style={{ padding: "0.4rem 0.85rem", border: `1px solid ${C.border}`, borderRadius: 6, background: "transparent", color: C.text2, cursor: "pointer", fontFamily: "'Share Tech Mono',monospace", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
            {isDark ? "☀ Light" : "🌙 Dark"}
          </button>
          <button onClick={handleLogout} style={{ padding: "0.4rem 0.85rem", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 6, background: "rgba(248,113,113,0.08)", color: C.danger, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.85rem" }}>
            ⏻ End Session
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "1rem 1.5rem 0", position: "relative", zIndex: 1 }}>
        {(["overview","services","chat"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.5rem 1.25rem", border: `1px solid ${activeTab === tab ? C.primaryBorder : C.border}`, borderRadius: 8, background: activeTab === tab ? C.primaryBg : "transparent", color: activeTab === tab ? C.primary : C.muted, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.05em" }}>
            {tab === "overview" && "◉ "}{tab === "services" && "⚡ "}{tab === "chat" && "💬 "}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: "1.25rem 1.5rem", position: "relative", zIndex: 1 }}>

        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {/* Timer */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", marginBottom: "0.5rem" }}>Time Remaining</div>
              <div style={{ fontSize: "3.5rem", fontWeight: 600, fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.1em", lineHeight: 1, color: isLow ? C.danger : C.primary, textShadow: `0 0 30px ${isLow ? "rgba(248,113,113,0.4)" : "rgba(0,212,255,0.3)"}` }}>
                {loading ? "--:--" : session ? fmt(remaining) : "No Session"}
              </div>
              <div style={{ height: 4, background: C.surface2, borderRadius: 2, margin: "1rem 0", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, transition: "width 1s linear", background: isLow ? "linear-gradient(90deg,#dc2626,#f87171)" : "linear-gradient(90deg,#0284c7,#00d4ff)" }} />
              </div>
              {isLow && <div style={{ background: `${C.danger}11`, border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "0.4rem 0.75rem", fontSize: "0.75rem", color: C.danger, fontFamily: "'Share Tech Mono',monospace", marginBottom: "0.75rem" }}>⚠ Less than 5 minutes remaining!</div>}
              {!session && !loading && (
                <div style={{ background: `${C.warning}11`, border: `1px solid ${C.warning}44`, borderRadius: 6, padding: "0.4rem 0.75rem", fontSize: "0.75rem", color: C.warning, fontFamily: "'Share Tech Mono',monospace", marginBottom: "0.75rem" }}>
                  No active session. Please ask the admin to start one.
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: "0.75rem" }}>
                {[
                  ["Cost so far", `KSh ${cost.toFixed(2)}`, C.success],
                  ["Rate", `KSh ${session?.hourly_rate_at_start?.toFixed(2) || "--"}/hr`, C.text],
                  ["Status", session ? "Active" : "No Session", session ? C.success : C.muted]
                ].map(([label, val, color]) => (
                  <div key={label as string} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Share Tech Mono',monospace" }}>{label}</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 500, color: color as string }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Offers */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem" }}>
              <h2 style={{ fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", marginBottom: "1rem" }}>What We Offer</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["🖥","High-Speed PCs","Latest hardware with fast internet"],["🖨","Printing","Color & B/W printing services"],["📶","Fast WiFi","High-speed broadband connection"],["📄","Scanning","Document scanning & digitizing"],["🍔","Snacks & Drinks","Refreshments available on request"],["🎮","Gaming","Gaming PCs with top titles"]].map(([icon,title,desc]) => (
                  <div key={title as string} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0.6rem", borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{icon}</span>
                    <div>
                      <p style={{ fontSize: "0.82rem", fontWeight: 500, color: C.text, margin: 0 }}>{title}</p>
                      <p style={{ fontSize: "0.68rem", color: C.muted, margin: 0, fontFamily: "'Share Tech Mono',monospace" }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent requests */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem" }}>
              <h2 style={{ fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", marginBottom: "1rem" }}>Recent Requests</h2>
              {requests.length === 0
                ? <p style={{ fontSize: "0.8rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace", textAlign: "center", padding: "1.5rem 0" }}>No requests yet.</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {requests.slice(0,5).map((r) => (
                      <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: C.surface2, borderRadius: 6 }}>
                        <span style={{ fontSize: "0.85rem", color: C.text, textTransform: "capitalize" }}>{r.type.replace("_"," ")}</span>
                        <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: 4, border: "1px solid", fontFamily: "'Share Tech Mono',monospace", ...reqColor(r.status) }}>{r.status}</span>
                      </div>
                    ))}
                  </div>}
            </div>
          </div>
        )}

        {/* Services */}
        {activeTab === "services" && (
          <div style={{ maxWidth: 700 }}>
            <p style={{ fontSize: "0.8rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace", marginBottom: "1.25rem", letterSpacing: "0.05em" }}>Click a service to send a request to the admin.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
              {services.map((svc) => (
                <button key={svc.type} onClick={() => sendRequest(svc.type)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.25rem 1rem", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                  <span style={{ fontSize: "1.8rem" }}>{svc.icon}</span>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: C.text, margin: 0 }}>{svc.label}</p>
                  <p style={{ fontSize: "0.68rem", color: C.muted, margin: 0, fontFamily: "'Share Tech Mono',monospace" }}>{svc.desc}</p>
                </button>
              ))}
            </div>
            {requests.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Share Tech Mono',monospace", marginBottom: "0.75rem" }}>All Requests</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {requests.map((r) => (
                    <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                      <span style={{ fontSize: "0.85rem", color: C.text, textTransform: "capitalize" }}>{r.type.replace("_"," ")}</span>
                      <span style={{ fontSize: "0.72rem", color: C.muted, fontFamily: "'Share Tech Mono',monospace" }}>{new Date(r.created_at).toLocaleTimeString()}</span>
                      <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: 4, border: "1px solid", fontFamily: "'Share Tech Mono',monospace", ...reqColor(r.status) }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat */}
        {activeTab === "chat" && (
          <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1rem", minHeight: 300, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0
                ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, color: C.muted, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.8rem", textAlign: "center" }}>
                    <span style={{ fontSize: "2rem" }}>💬</span><p>No messages yet. Say hello to the admin!</p>
                  </div>
                : messages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.from === "client" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "75%", padding: "0.6rem 0.9rem", borderRadius: 10, fontSize: "0.9rem", lineHeight: 1.4, display: "flex", flexDirection: "column", gap: 4, background: msg.from === "client" ? C.primaryBg : C.surface2, border: `1px solid ${msg.from === "client" ? C.primaryBorder : C.border}`, color: msg.from === "client" ? C.primary : C.text }}>
                        {msg.text}
                        <span style={{ fontSize: "0.65rem", opacity: 0.5, fontFamily: "'Share Tech Mono',monospace", alignSelf: "flex-end" }}>{msg.time}</span>
                      </div>
                    </div>
                  ))}
            </div>
            <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1, padding: "0.65rem 1rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "'Share Tech Mono',monospace", fontSize: "0.9rem", outline: "none" }} placeholder="Type a message to admin..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button type="submit" disabled={sending || !newMessage.trim()} style={{ padding: "0.65rem 1.25rem", background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, borderRadius: 8, color: C.primary, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: "0.9rem", fontWeight: 600 }}>Send →</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
