import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Image as ImageIcon, Sparkles, Settings, Search, FileText, Activity, Home, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Library", path: "/library", icon: ImageIcon },
    { name: "Search", path: "/search", icon: Search },
    { name: "Design DNA", path: "/dna", icon: Sparkles },
    { name: "Inspiration", path: "/inspiration", icon: FileText },
    { name: "Visual Studio", path: "/studio", icon: ImageIcon },
    { name: "Monitor", path: "/monitor", icon: Activity },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans selection:bg-white/20">
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 z-30 flex items-center justify-between px-4">
        <span className="font-medium text-base tracking-wide text-neutral-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/80" />
          Design Intel
        </span>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -mr-2 text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg active:bg-neutral-800"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 right-0 w-64 border-l md:border-l-0 md:border-r border-neutral-800/50 bg-neutral-950 flex flex-col z-50 shadow-2xl shadow-black/50 transition-transform duration-300 md:relative md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-16 md:h-20 flex items-center justify-between md:justify-start px-6 md:px-8 border-b border-neutral-800/50">
          <span className="font-medium text-lg tracking-wide text-neutral-200 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/80 hidden md:block" />
            <span className="md:block">Menu</span>
          </span>
          <button 
            className="md:hidden p-2 -mr-2 text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
            onClick={closeMobileMenu}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-md text-sm transition-all duration-200",
                  isActive 
                    ? "bg-neutral-800/80 text-neutral-100 shadow-sm" 
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30 active:bg-neutral-800"
                )}
              >
                <Icon className={cn("w-5 h-5 md:w-4 md:h-4", isActive ? "opacity-100" : "opacity-70")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-neutral-800/50 pb-8 md:pb-6">
          <Link 
            to="/settings" 
            onClick={closeMobileMenu}
            className="w-full flex items-center justify-center gap-2 bg-neutral-100 active:bg-neutral-300 hover:bg-white text-neutral-950 px-4 py-3 md:py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm min-h-[44px]"
          >
            Pinterest Status
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-950 relative pt-16 md:pt-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />
        <div className="h-full relative z-10 p-4 sm:p-6 md:p-10 lg:p-12 pb-24 md:pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
