import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Printer, ScanLine, HelpCircle, Plus, MessageSquare,
  LogOut, Send, Monitor, Wifi
} from "lucide-react";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [requests, setRequests] = useState<{ type: string; status: string }[]>([]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [...prev, { from: "client", text: newMessage }]);
    setNewMessage("");
    // TODO: send to backend
  };

  const sendRequest = (type: string) => {
    setRequests((prev) => [...prev, { type, status: "pending" }]);
    // TODO: send to backend
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary font-display">Client Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="w-3 h-3 text-success" />
              <span>Connected • PC-04</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="w-4 h-4 mr-1" /> End Session
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Card */}
        <div className="glass-card p-6 neon-glow flex flex-col items-center justify-center text-center">
          <Clock className="w-10 h-10 text-primary mb-3 animate-pulse-neon" />
          <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
          <p className="text-5xl font-bold text-primary font-display neon-text tracking-wider">
            --:--
          </p>
          <p className="text-xs text-muted-foreground mt-2">Session cost: --</p>
          <Badge variant="outline" className="mt-3 border-success text-success">
            Active
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-display text-muted-foreground mb-4 uppercase tracking-wider">Services</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:neon-glow hover:border-primary border border-transparent transition-all"
              onClick={() => sendRequest("print")}
            >
              <Printer className="w-5 h-5 text-primary" />
              <span className="text-xs">Print</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:neon-glow hover:border-primary border border-transparent transition-all"
              onClick={() => sendRequest("scan")}
            >
              <ScanLine className="w-5 h-5 text-primary" />
              <span className="text-xs">Scan</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:neon-glow hover:border-primary border border-transparent transition-all"
              onClick={() => sendRequest("time_extension")}
            >
              <Plus className="w-5 h-5 text-accent" />
              <span className="text-xs">Add Time</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:neon-glow hover:border-primary border border-transparent transition-all"
              onClick={() => sendRequest("assistance")}
            >
              <HelpCircle className="w-5 h-5 text-accent" />
              <span className="text-xs">Help</span>
            </Button>
          </div>

          {/* Recent requests */}
          {requests.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs text-muted-foreground font-display uppercase tracking-wider">Recent Requests</h3>
              {requests.slice(-3).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-secondary">
                  <span className="capitalize text-foreground">{r.type.replace("_", " ")}</span>
                  <Badge variant="outline" className="text-xs border-warning text-warning">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-sm font-display text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Chat with Admin
          </h2>
          <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto space-y-2 mb-4 p-2 rounded bg-secondary/50">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Send a message to the admin.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.from === "client"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-secondary border-border focus:border-primary"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
