import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Shops from "./pages/Shops";
import Medicines from "./pages/Medicines";
import StockIn from "./pages/StockIn";
import Stock from "./pages/Stock";
import Supply from "./pages/Supply";
import AlertBar from "./components/AlertBar";
import NotificationBell from "./components/NotificationBell";
import ThemeToggle from "./components/ThemeToggle";
import Dashboard from "./pages/Dashboard";
import Welcome from "./pages/Welcome";

// small line icons (no extra package needed)
const ICONS = {
  shops: "M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6",
  medicines:
    "M10.5 20.5l10-10a4.95 4.95 0 00-7-7l-10 10a4.95 4.95 0 007 7zM8.5 8.5l7 7",
  stockIn: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  stock: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
  supply:
    "M1 6h13v10H1zM14 10h4l3 3v3h-7M5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  plus: "M12 5v14M5 12h14",
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
};

function Icon({ name, className = "h-[18px] w-[18px]" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const links = [
  { to: "/shops", label: "Shops", icon: "shops" },
  { to: "/medicines", label: "Medicines", icon: "medicines" },
  { to: "/stock-in", label: "Stock-in", icon: "stockIn" },
  { to: "/stock", label: "Stock", icon: "stock" },
  { to: "/supply", label: "Supply", icon: "supply" },
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
];

// the sidebar and the page area, only for logged-in people
function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // dark mode: remembered in this browser
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("medicoo_theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("medicoo_theme", dark ? "dark" : "light");
    } catch {
      // saving the choice is optional
    }
  }, [dark]);

  // not logged in: go to the login page
  if (!user) return <Navigate to="/login" replace />;

  const current = links.find((l) => location.pathname.startsWith(l.to));

  return (
    <div className={`flex min-h-screen text-slate-800 ${dark ? "dark" : ""}`}>
      {/* ---------- Sidebar ---------- */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-[#2b1466]">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Icon name="plus" className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Medicoo
          </span>
        </div>

        <p className="px-5 pb-2 pt-3 text-xs font-medium text-[#9a8bd4]">
          Inventory workspace
        </p>

        <nav className="flex flex-col gap-1 px-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-[#cfc4f3] hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon name={l.icon} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* signed-in user + log out */}
        <div className="mt-auto border-t border-white/15 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
              {user.name?.[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="text-xs capitalize text-[#9a8bd4]">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="btn w-full gap-2 border border-white/25 text-white hover:bg-white/10">
            <Icon name="logout" className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* ---------- Page area ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* sticky top bar: stays in view while you scroll */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-[#e9e5f7] bg-white/80 px-8 text-sm backdrop-blur">
          <div className="flex items-center gap-2.5 text-slate-500">
            {current && (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-600"
                style={{ background: "linear-gradient(135deg, #f1ecff, #dff5f2)" }}
              >
                <Icon name={current.icon} className="h-4 w-4" />
              </span>
            )}
            <span>Inventory</span>
            {current && (
              <>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-[#2b1466]">
                  {current.label}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-slate-500 sm:block">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
            <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            <NotificationBell />
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 font-medium text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {user.name?.[0]?.toUpperCase()}
              </span>
              {user.name}
            </div>
          </div>

          {/* thin purple-to-teal line under the bar */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5"
            style={{
              background:
                "linear-gradient(90deg, #6a3be0 0%, #0d9488 45%, rgba(13,148,136,0) 100%)",
            }}
          />
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mx-auto w-full max-w-6xl">
            {/* the alert bar shows on every page when something needs attention */}
            <AlertBar />
            {/* key makes the page fade in each time you change page */}
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* first page people see: the welcome page. Logged-in people go straight in */}
      <Route
        path="/"
        element={user ? <Navigate to="/shops" replace /> : <Welcome />}
      />

      {/* the login page has no sidebar, and logged-in people skip it */}
      <Route
        path="/login"
        element={user ? <Navigate to="/shops" replace /> : <Login />}
      />

      {/* everything inside Layout needs a login */}
      <Route element={<Layout />}>
        <Route path="/shops" element={<Shops />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/stock-in" element={<StockIn />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/supply" element={<Supply />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/shops" replace />} />
    </Routes>
  );
}