import { Outlet, NavLink, useLocation } from "react-router-dom";
import { IconDashboard, IconUsers, IconCalendar, IconReceipt, IconReport, IconSettings, IconShield, IconMessage } from "@tabler/icons-react";

const navItems = [
  { to: "/", icon: IconDashboard, label: "Dashboard" },
  { to: "/patients", icon: IconUsers, label: "Patients" },
  { to: "/sessions", icon: IconReport, label: "Sessions" },
  { to: "/regular-visits", icon: IconCalendar, label: "Regular Visits" },
  { to: "/calendar", icon: IconCalendar, label: "Calendar" },
  { to: "/payments", icon: IconReceipt, label: "Payments" },
];

const adminItems = [
  { to: "/admin/telegram", icon: IconMessage, label: "Telegram" },
  { to: "/admin/security", icon: IconShield, label: "Security" },
  { to: "/admin/roles", icon: IconSettings, label: "Roles" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[#f0f7f4]">
      {/* Sidebar */}
      <aside className="w-[248px] bg-[#0d4a2c] min-h-screen fixed left-0 top-0 flex flex-col z-50">
        <div className="p-5 pb-4 border-b border-white/10">
          <h1 className="font-['Syne'] text-sm text-white font-extrabold leading-tight">SNC</h1>
          <small className="text-xs text-white/40">Siyaram Neurotherapy Center</small>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-bold text-white/30 tracking-widest uppercase">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 cursor-pointer text-[13.5px] font-medium border-l-[3px] transition-all ${
                  isActive
                    ? "bg-white/11 text-white border-[#e8a020]"
                    : "text-white/60 border-transparent hover:bg-white/7 hover:text-white"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}

          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-white/30 tracking-widest uppercase">Admin</div>
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 cursor-pointer text-[13.5px] font-medium border-l-[3px] transition-all ${
                  isActive
                    ? "bg-white/11 text-white border-[#e8a020]"
                    : "text-white/60 border-transparent hover:bg-white/7 hover:text-white"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 bg-white/8 rounded-lg">
            <div className="w-8 h-8 bg-[#e8a020] rounded-full flex items-center justify-center font-extrabold text-xs text-[#0d4a2c]">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white font-semibold truncate">Admin</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide">ADMIN</div>
            </div>
            <button className="bg-none border-none text-white/40 cursor-pointer text-base hover:text-white transition-colors">
              ⬆
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[248px] flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-[58px] bg-white border-b border-[#cfe0d8] flex items-center px-6 sticky top-0 z-40 gap-3">
          <h2 className="font-['Syne'] text-lg font-extrabold text-[#0d4a2c] flex-1">
            {navItems.find(n => n.to === location.pathname)?.label ||
             adminItems.find(n => n.to === location.pathname)?.label ||
             "Dashboard"}
          </h2>
          <span className="bg-[#d4ede1] text-[#1a7a4a] px-3 py-1 rounded-full text-[11px] font-bold">
            Siyaram Neurotherapy
          </span>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
