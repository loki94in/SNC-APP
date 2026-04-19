import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { IconDashboard, IconUsers, IconCalendar, IconReceipt, IconReport, IconSettings, IconShield, IconMessage, IconListCheck } from "@tabler/icons-react";
import { clearAuth } from "@/lib/api";
import { useAuth } from "@/App";
import { usePermission } from "@/App";
import { emitAppEvent, clearAllAppListeners } from "@/lib/appEvents";

// ─── Visible nav items per-role ──────────────────────────────────────────────

function MainNav() {
  const dash = usePermission("dashboard");
  const pts = usePermission("patients");
  const sess = usePermission("sessions");
  const reg = usePermission("regular-visits");
  const cal = usePermission("calendar");
  const pay = usePermission("payments");

  const items = [
    { to: "/", icon: IconDashboard, label: "Dashboard", key: "dashboard", perm: dash },
    { to: "/patients", icon: IconUsers, label: "Patients", key: "patients", perm: pts },
    { to: "/sessions", icon: IconReport, label: "Sessions", key: "sessions", perm: sess },
    { to: "/regular-visits", icon: IconListCheck, label: "Regular Visits", key: "regular-visits", perm: reg },
    { to: "/calendar", icon: IconCalendar, label: "Calendar", key: "calendar", perm: cal },
    { to: "/payments", icon: IconReceipt, label: "Payments", key: "payments", perm: pay },
  ];

  return (
    <>
      <div className="px-4 py-2 text-[10px] font-bold text-white/30 tracking-widest uppercase">Main</div>
      {items.map((item) =>
        item.perm.canView ? (
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
        ) : null
      )}
    </>
  );
}

function AdminNav() {
  const { permissions } = useAuth();
  if (permissions["admin-telegram"] !== "EDIT" &&
      permissions["admin-security"] !== "EDIT" &&
      permissions["admin-roles"] !== "EDIT") {
    return null;
  }

  const adminItems = [
    { to: "/admin/telegram", icon: IconMessage, label: "Telegram" },
    { to: "/admin/security", icon: IconShield, label: "Security" },
    { to: "/admin/roles", icon: IconSettings, label: "Roles" },
  ];

  return (
    <>
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
    </>
  );
}

// ─── Page title map ─────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/sessions": "Sessions",
  "/regular-visits": "Regular Visits",
  "/calendar": "Calendar",
  "/payments": "Payments",
  "/admin/telegram": "Telegram",
  "/admin/security": "Security",
  "/admin/roles": "Roles",
};

const DEFAULT_LABEL = "Dashboard";

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    emitAppEvent("app:logout");
    clearAllAppListeners();
    clearAuth();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";
  const roleLabel = user?.role || "ADMIN";

  const pageLabel = PAGE_LABELS[location.pathname] ?? DEFAULT_LABEL;

  return (
    <div className="flex min-h-screen bg-[#f0f7f4]">
      {/* Sidebar */}
      <aside className="w-[248px] bg-[#0d4a2c] min-h-screen fixed left-0 top-0 flex flex-col z-50">
        <div className="p-5 pb-4 border-b border-white/10">
          <h1 className="font-['Syne'] text-sm text-white font-extrabold leading-tight">SNC</h1>
          <small className="text-xs text-white/40">Siyaram Neurotherapy Center</small>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          <MainNav />
          <AdminNav />
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 bg-white/8 rounded-lg">
            <div className="w-8 h-8 bg-[#e8a020] rounded-full flex items-center justify-center font-extrabold text-xs text-[#0d4a2c]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white font-semibold truncate">{user?.name || "Admin"}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide">{roleLabel}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="bg-none border-none text-white/40 cursor-pointer text-base hover:text-white transition-colors"
            >
              &#8593;
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[248px] flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-[58px] bg-white border-b border-[#cfe0d8] flex items-center px-6 sticky top-0 z-40 gap-3">
          <h2 className="font-['Syne'] text-lg font-extrabold text-[#0d4a2c] flex-1">
            {pageLabel}
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
