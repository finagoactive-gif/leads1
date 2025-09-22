import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Plus, 
  User, 
  Search, 
  Clock, 
  Users, 
  Coins,
  LogOut 
} from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const menuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["user", "admin", "superadmin"] },
    { href: "/submit-lead", icon: Plus, label: "Submit Lead", roles: ["user", "admin", "superadmin"] },
    { href: "/my-leads", icon: User, label: "My Leads", roles: ["user", "admin", "superadmin"] },
    { href: "/browse-leads", icon: Search, label: "Browse Leads", roles: ["user", "admin", "superadmin"] },
    { href: "/pending-leads", icon: Clock, label: "Pending Leads", roles: ["admin", "superadmin"], badge: true },
    { href: "/manage-users", icon: Users, label: "Manage Users", roles: ["superadmin"] },
    { href: "/credit-management", icon: Coins, label: "Credit Management", roles: ["superadmin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Leads Exchange</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Credits:</span>
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium" data-testid="user-credits">
            {user.credits}
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-accent text-foreground font-medium' 
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {item.badge && item.href === "/pending-leads" && (
                      <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs ml-auto">
                        3
                      </span>
                    )}
                  </a>
                </Link>
              </li>
            );
          })}
          
          {(user.role === "admin" || user.role === "superadmin") && (
            <li className="pt-4 mt-4 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Admin
              </span>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
            <span data-testid="user-initials">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground" data-testid="user-name">{user.name}</p>
            <p className="text-xs text-muted-foreground" data-testid="user-role">{user.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
