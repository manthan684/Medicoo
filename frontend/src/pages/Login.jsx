import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: "stock", label: "Stock and batches" },
  { icon: "bell", label: "Expiry alerts" },
  { icon: "history", label: "Supply history" },
];

// small line icons (no extra package needed)
const ICONS = {
  plus: "M12 5v14M5 12h14",
  lock: "M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff:
    "M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.2 3.9M6.6 6.7C3.9 8.4 2 12 2 12s4 7 10 7a9.7 9.7 0 004.1-.9M9.9 9.9a3 3 0 004.2 4.2",
  back: "M15 6l-6 6 6 6",
  stock: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  history: "M3 12a9 9 0 109-9 9 9 0 00-6.7 3L3 8M3 3v5h5M12 7v5l3 2",
};

function Icon({ name, className = "h-5 w-5", stroke = 1.8 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

// the movement on this page: one calm entrance, and the lock tile floats.
// It is switched off for people who prefer reduced motion.
const CSS = `
@keyframes lg-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes lg-float{from{transform:translateY(0)}to{transform:translateY(-7px)}}
.lg-in{animation:lg-rise .7s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms)}
.lg-float{animation:lg-float 4.5s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){.lg-in,.lg-float{animation:none}}
`;

const inputClass =
  "w-full rounded-xl border border-[#e3d9ea] bg-white py-3 pl-11 text-[15px] text-[#3b0a4d] placeholder:text-[#a791b4] outline-none transition focus:border-[#860a86] focus:ring-4 focus:ring-[#860a86]/15";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/shops");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* the whole page: two panels, edge to edge */}
      <div className="grid min-h-screen w-full bg-white lg:grid-cols-[5fr_7fr]">
        {/* ---------- Left: brand panel (same as the welcome page) ---------- */}
        <aside
          className="hidden flex-col justify-between px-10 py-10 text-white lg:flex xl:px-14"
          style={{
            background:
              "linear-gradient(175deg, #8a0a8a 0%, #5c0a78 42%, #430a62 100%)",
          }}
        >
          <Link
            to="/"
            aria-label="Medicoo welcome page"
            className="lg-in flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#7b0a86]">
              <Icon name="plus" className="h-6 w-6" stroke={3} />
            </span>
            <span className="text-xl font-semibold tracking-tight">Medicoo</span>
          </Link>

          <div className="lg-in" style={{ "--d": "150ms" }}>
            <div className="lg-float mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-teal-300">
              <Icon name="lock" className="h-7 w-7" />
            </div>

            <h2 className="max-w-sm text-[2.25rem] font-semibold leading-[1.12] tracking-[-0.02em]">
              Your pharmacy, always within reach.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/75">
              Log in securely to manage stock, prevent waste, and keep every
              medicine accounted for.
            </p>

            <ul className="mt-9 grid max-w-sm grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <li
                  key={f.label}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4"
                >
                  <Icon name={f.icon} className="h-5 w-5 text-teal-300" />
                  <p className="mt-3 text-sm font-medium leading-snug">
                    {f.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/65">
            © {new Date().getFullYear()} Medicoo. Secure medicine management.
          </p>
        </aside>

        {/* ---------- Right: the form ---------- */}
        <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[430px]">
            {/* logo, shown only on small screens (the left panel is hidden there) */}
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b0a86] text-white">
                <Icon name="plus" className="h-5 w-5" stroke={3} />
              </span>
              <span className="text-lg font-semibold tracking-tight text-[#3b0a4d]">
                Medicoo
              </span>
            </div>

            <Link
              to="/"
              className="lg-in inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[#7d5f8c] transition-colors hover:text-[#3b0a4d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#860a86]/20"
            >
              <Icon name="back" className="h-4 w-4" stroke={2} />
              Back to home
            </Link>

            <form onSubmit={handleSubmit}>
              <div className="lg-in" style={{ "--d": "100ms" }}>
                <h1 className="mt-10 text-[2rem] font-bold leading-tight tracking-[-0.02em] text-[#3b0a4d]">
                  Log in to Medicoo
                </h1>
                <p className="mt-2 text-[15px] text-[#7d5f8c]">
                  Enter your details to continue to your workspace.
                </p>
              </div>

              <div
                className="lg-in mt-9 space-y-5"
                style={{ "--d": "200ms" }}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#3b0a4d]"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a791b4]">
                      <Icon name="mail" className="h-[18px] w-[18px]" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      className={`${inputClass} pr-4`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#3b0a4d]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a791b4]">
                      <Icon name="lock" className="h-[18px] w-[18px]" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`${inputClass} pr-12`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#7d5f8c] transition-colors hover:bg-[#f7f0fa] hover:text-[#3b0a4d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#860a86]/20"
                    >
                      <Icon
                        name={showPassword ? "eyeOff" : "eye"}
                        className="h-[18px] w-[18px]"
                      />
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="alert-error">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_26px_-10px_rgba(122,10,134,0.6)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#860a86]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background: "linear-gradient(180deg, #8a0a8e, #6f0a80)",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}