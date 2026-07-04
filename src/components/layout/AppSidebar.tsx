import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Beef, 
  Route, 
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  Users,
  ClipboardList,
  Heart,
  ShoppingBag,
  Building2,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFarm } from '@/hooks/useFarm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// Navigation items per role
const farmerNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Livestock', href: '/livestock', icon: Beef },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { name: 'Traceability', href: '/traceability', icon: Route },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'User Access', href: '/users', icon: Users },
];

const vetNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Animals', href: '/livestock', icon: Beef },
  { name: 'Health Records', href: '/health-records', icon: Heart },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { name: 'My Profile', href: '/profile', icon: User },
];

const farmManagerNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Livestock', href: '/livestock', icon: Beef },
  { name: 'Health Overview', href: '/health-overview', icon: Stethoscope },
  { name: 'Movement Log', href: '/movements', icon: Route },
];

const clientNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Browse Animals', href: '/browse', icon: ShoppingBag },
  { name: 'My Interests', href: '/interests', icon: ClipboardList },
  { name: 'My Profile', href: '/profile', icon: User },
];

const getRoleName = (role: string | null): string => {
  switch (role) {
    case 'farmer':
    case 'admin':
      return 'Farmer';
    case 'vet':
      return 'Veterinarian';
    case 'farm_manager':
      return 'Farm Manager';
    case 'client':
      return 'Client';
    default:
      return 'User';
  }
};

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut, role, isFarmer, isVet, isFarmManager, isClient } = useAuth();
  const { currentFarm, farmCode } = useFarm();
  const [collapsed, setCollapsed] = useState(false);

  // Select navigation based on role
  let navigation = farmerNavigation;
  if (isVet) navigation = vetNavigation;
  else if (isFarmManager) navigation = farmManagerNavigation;
  else if (isClient) navigation = clientNavigation;

  const portalName = isFarmer ? 'Farmer Dashboard' 
    : isVet ? 'Vet Portal' 
    : isFarmManager ? 'Manager Portal' 
    : isClient ? 'Client View' 
    : 'FarmSync';

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <Beef className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-sm">FarmSync</span>
                <span className="text-xs text-sidebar-foreground/60">{portalName}</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Beef className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        {/* Farm Info (for farmers/managers) */}
        {(isFarmer || isFarmManager) && currentFarm && !collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/30">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sidebar-foreground/70" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {currentFarm.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 font-mono">
                  {farmCode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 mb-2",
            collapsed && "justify-center px-2"
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {getRoleName(role)}
                </p>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn(
              "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
