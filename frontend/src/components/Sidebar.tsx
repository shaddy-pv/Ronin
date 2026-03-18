import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Cpu, AlertTriangle, History, Settings, LogOut, User, Lightbulb, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/rover", icon: Cpu, label: "Rover Console" },
    { to: "/face-recognition", icon: Camera, label: "Face Recognition" },
    { to: "/solution", icon: Lightbulb, label: "Solution" },
    { to: "/alerts", icon: AlertTriangle, label: "Alerts" },
    { to: "/history", icon: History, label: "History" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">AROHAN</h1>
        <p className="text-xs text-muted-foreground">Command Center</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            activeClassName="bg-accent text-foreground"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {/* User Info */}
        {currentUser && (
          <div className="px-4 py-2 bg-secondary rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold">Logged in as:</span>
            </div>
            <p className="text-xs text-muted-foreground truncate" title={currentUser.email || ''}>
              {currentUser.email}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
};
