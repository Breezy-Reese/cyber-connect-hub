import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Monitor, Users, DollarSign, Clock, CheckCircle, XCircle,
  MessageSquare, Send, LogOut, Lock, Plus, Minus, AlertTriangle
} from "lucide-react";

interface Session {
  id: string;
  user: string;
  pc: string;
  remaining: string;
  status: "active" | "idle";
}

interface Request {
  id: string;
  user: string;
  type: string;
  status: "pending" | "approved" | "rejected";
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions] = useState<Session[]>([]);
  const [pendingRequests] = useState<Request[]>([]);
  const [adminMessages, setAdminMessages] = useState<{ from: string; text: string; to: string }[]>([]);
  const [newAdminMessage, setNewAdminMessage] = useState("");
  const [selectedClient] = useState<string | null>(null);

  const sendAdminMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminMessage.trim() || !selectedClient) return;
    setAdminMessages((prev) => [...prev, { from: "admin", text: newAdminMessage, to: selectedClient }]);
    setNewAdminMessage("");
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-secondary ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-display">{label}</p>
        <p className="text-2xl font-bold font-display">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-primary font-display">Admin Panel</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-muted-foreground text-muted-foreground hover:bg-secondary">
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Active Users" value={String(sessions.length)} color="text-primary" />
        <StatCard icon={Monitor} label="PCs Online" value="--" color="text-success" />
        <StatCard icon={AlertTriangle} label="Pending" value={String(pendingRequests.length)} color="text-warning" />
        <StatCard icon={DollarSign} label="Earnings" value="--" color="text-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sessions */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-display text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> Active Sessions
          </h2>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No active sessions</p>
              <p className="text-xs mt-1">Sessions will appear here when clients log in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.user}</p>
                      <p className="text-xs text-muted-foreground">{session.pc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display text-primary">{session.remaining}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:text-success">
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-warning hover:text-warning">
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Lock className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requests & Chat */}
        <div className="space-y-6">
          {/* Pending Requests */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-display text-muted-foreground mb-4 uppercase tracking-wider">
              Requests
            </h2>
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded bg-secondary">
                    <div>
                      <p className="text-sm text-foreground capitalize">{req.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{req.user}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-success">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Chat */}
          <div className="glass-card p-6 flex flex-col">
            <h2 className="text-sm font-display text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Messages
            </h2>
            <div className="min-h-[150px] max-h-[200px] overflow-y-auto space-y-2 mb-4 p-2 rounded bg-secondary/50">
              {adminMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Select a client to chat</p>
              ) : (
                adminMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.from === "admin"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendAdminMessage} className="flex gap-2">
              <Input
                placeholder={selectedClient ? `Message ${selectedClient}...` : "Select a client first"}
                value={newAdminMessage}
                onChange={(e) => setNewAdminMessage(e.target.value)}
                className="bg-secondary border-border focus:border-primary"
                disabled={!selectedClient}
              />
              <Button type="submit" size="icon" className="shrink-0" disabled={!selectedClient}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
