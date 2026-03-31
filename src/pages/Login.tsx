import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Ticket, User, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Connect to backend
    setTimeout(() => {
      setIsLoading(false);
      navigate("/client");
    }, 500);
  };

  const handleTicketLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Connect to backend
    setTimeout(() => {
      setIsLoading(false);
      navigate("/client");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Monitor className="w-10 h-10 text-primary neon-text" />
            <h1 className="text-3xl font-bold text-primary neon-text">CyberCafe</h1>
          </div>
          <p className="text-muted-foreground">Log in to start your session</p>
        </div>

        <div className="glass-card p-6">
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="credentials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-display text-xs">
                <User className="w-4 h-4 mr-2" />
                Username
              </TabsTrigger>
              <TabsTrigger value="ticket" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-display text-xs">
                <Ticket className="w-4 h-4 mr-2" />
                Ticket Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="mt-6">
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full neon-glow" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Start Session"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="ticket" className="mt-6">
              <form onSubmit={handleTicketLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket" className="text-foreground">Ticket Code</Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="ticket"
                      placeholder="Enter your ticket code"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value)}
                      className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary font-display tracking-widest text-center"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full neon-glow" disabled={isLoading}>
                  {isLoading ? "Validating..." : "Start Session"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <button
              onClick={() => navigate("/admin")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-display"
            >
              Admin Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
