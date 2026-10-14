import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const LINES = ["Welcome to", "Medicoo"];
const TOTAL = LINES[0].length + LINES[1].length;
const SPEED = 70; // milliseconds per letter
const START_DELAY = 500; // wait a moment before the typing starts

const FEATURES = [
  {
    icon: "stock",
    title: "Stock and batches",
    text: "Keep medicine quantities and batch details together.",
  },
  {
    icon: "bell",
    title: "Expiry alerts",
    text: "Review upcoming expiry dates at a glance.",
  },
  {
    icon: "history",
    title: "Supply history",
    text: "Look back on your medicine supply records.",
  },
];

// small line icons (no extra package needed)
const ICONS = {
  stock: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  history: "M3 12a9 9 0 109-9 9 9 0 00-6.7 3L3 8M3 3v5h5M12 7v5l3 2",
  pill: "M10.5 20.5l10-10a4.95 4.95 0 00-7-7l-10 10a4.95 4.95 0 007 7zM8.5 8.5l7 7",
  box: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
  arrow: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
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

// all the movement on this page lives here, and is switched off for people
// who prefer reduced motion
const CSS = `
@keyframes wl-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes wl-pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
@keyframes wl-float{from{transform:translateY(0)}to{transform:translateY(-8px)}}
@keyframes wl-ring{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.05);opacity:1}}
@keyframes wl-blink{50%{opacity:0}}
.wl-rise{opacity:0}
.wl-go .wl-rise{animation:wl-rise .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms)}
.wl-intro{animation:wl-rise .8s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms)}
.wl-pop{animation:wl-pop .9s cubic-bezier(.2,.7,.2,1) both .15s}
.wl-float{animation:wl-float 4.5s ease-in-out infinite alternate}
.wl-float-b{animation:wl-float 5.5s ease-in-out -2s infinite alternate}
.wl-float-c{animation:wl-float 6.5s ease-in-out -4s infinite alternate}
.wl-ring{animation:wl-ring 6s ease-in-out infinite}
.wl-cursor{animation:wl-blink 1.06s steps(1) infinite}
@media (prefers-reduced-motion:reduce){
  .wl-rise{opacity:1}
  .wl-go .wl-rise,.wl-intro,.wl-pop,.wl-float,.wl-float-b,.wl-float-c,.wl-ring,.wl-cursor{animation:none}
}
`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// the full text stays invisible underneath, so the page does not jump while typing
function Typed({ full, typed, showCursor }) {
  return (
    <span className="grid justify-items-start">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {full}
      </span>
      <span className="col-start-1 row-start-1">
        {typed}
        {showCursor && (
          <span className="wl-cursor ml-1 inline-block h-[0.8em] w-[4px] translate-y-[0.06em] rounded-sm bg-teal-500" />
        )}
      </span>
    </span>
  );
}

export default function Welcome() {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? TOTAL : 0));

  // type one more letter at a time
  useEffect(() => {
    if (count >= TOTAL) return;
    const id = setTimeout(
      () => setCount((c) => c + 1),
      count === 0 ? START_DELAY : SPEED
    );
    return () => clearTimeout(id);
  }, [count]);

  const first = LINES[0].length;
  const typedA = LINES[0].slice(0, Math.min(count, first));
  const typedB = LINES[1].slice(0, Math.max(0, count - first));
  const onFirstLine = count <= first;
  const done = count >= TOTAL;

  return (
    <>
      <style>{CSS}</style>

      {/* the whole page: two panels, edge to edge */}
      <div className="grid min-h-screen w-full bg-white lg:grid-cols-[5fr_7fr]">
        {/* ---------- Left: brand panel ---------- */}
        <section
          className="hidden flex-col justify-between px-10 py-10 text-white lg:flex xl:px-14"
          style={{
            background:
              "linear-gradient(175deg, #8a0a8a 0%, #5c0a78 42%, #430a62 100%)",
          }}
        >
          <div className="wl-intro flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#7b0a86]">
              <Icon name="plus" className="h-6 w-6" stroke={3} />
            </span>
            <span className="text-xl font-semibold tracking-tight">Medicoo</span>
          </div>

          {/* the picture in the middle */}
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="wl-pop relative h-[300px] w-[340px]" aria-hidden="true">
              {/* faint ring */}
              <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2">
                <div className="wl-ring h-full w-full rounded-full border border-white/10" />
              </div>

              {/* pill tile (behind the card) */}
              <div className="absolute left-0 top-[64px] -rotate-6">
                <div className="wl-float-b flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#6a0f8a]/70 text-white">
                  <Icon name="pill" className="h-7 w-7" stroke={1.6} />
                </div>
              </div>

              {/* box tile (behind the card) */}
              <div className="absolute left-[250px] top-[188px] rotate-6">
                <div className="wl-float-c flex h-[70px] w-[70px] items-center justify-center rounded-2xl border border-white/15 bg-[#5a0a78]/80 text-white">
                  <Icon name="box" className="h-7 w-7" stroke={1.6} />
                </div>
              </div>

              {/* the main card */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div
                  className="wl-float flex h-[208px] w-[208px] flex-col items-center justify-center gap-6 rounded-[28px]"
                  style={{
                    background:
                      "linear-gradient(160deg, #fbf1fd 0%, #e9d3f3 55%, #d9b9ea 100%)",
                    boxShadow: "0 30px 60px -20px rgba(20,0,40,0.55)",
                  }}
                >
                  <span className="flex h-[78px] w-[78px] items-center justify-center rounded-[22px] bg-[#11b39a] text-white">
                    <Icon name="plus" className="h-10 w-10" stroke={3.2} />
                  </span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="h-1.5 w-[100px] rounded-full bg-[#b58acb]/70" />
                    <span className="h-1.5 w-16 rounded-full bg-[#c9a5dc]/70" />
                  </div>
                </div>
              </div>

              {/* small dots */}
              <span className="wl-ring absolute left-[292px] top-[40px] h-2 w-2 rounded-full bg-teal-400" />
              <span className="absolute left-[-30px] top-[236px] h-1.5 w-1.5 rounded-full bg-white/50" />
            </div>
          </div>

          <div>
            <div className="wl-intro" style={{ "--d": "300ms" }}>
              <h2 className="max-w-sm text-[2rem] font-medium leading-[1.15] tracking-[-0.01em]">
                Made for your everyday inventory.
              </h2>
              <p className="mt-3 text-sm text-white/70">
                A focused space for your medicines.
              </p>
            </div>

            <p className="mt-16 flex items-center gap-2 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Medicoo · Medical inventory
            </p>
          </div>
        </section>

        {/* ---------- Right: the welcome ---------- */}
        <section
          className={`flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 ${
            done ? "wl-go" : ""
          }`}
        >
          <div className="mx-auto w-full max-w-[570px]">
            {/* logo, shown only on small screens (the left panel is hidden there) */}
            <div className="mb-10 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b0a86] text-white">
                <Icon name="plus" className="h-5 w-5" stroke={3} />
              </span>
              <span className="text-lg font-semibold tracking-tight text-[#3b0a4d]">
                Medicoo
              </span>
            </div>

            <p
              className="wl-intro text-[11px] font-semibold uppercase tracking-[0.08em] text-[#860a86]"
              style={{ "--d": "100ms" }}
            >
              Your medical inventory workspace
            </p>

            <h1 className="sr-only">Welcome to Medicoo</h1>
            <div
              aria-hidden="true"
              className="mt-5 text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#3b0a4d] sm:text-[3.5rem]"
            >
              <Typed full={LINES[0]} typed={typedA} showCursor={onFirstLine} />
              <Typed full={LINES[1]} typed={typedB} showCursor={!onFirstLine} />
            </div>

            <p
              className="wl-rise mt-6 max-w-md text-base leading-relaxed text-[#7d5f8c]"
              style={{ "--d": "0ms" }}
            >
              Keep stock, expiry dates and supply records organized in one place.
            </p>

            <div
              className="wl-rise mt-8 flex items-center gap-7"
              style={{ "--d": "150ms" }}
            >
              <Link
                to="/login"
                className="group inline-flex w-[200px] items-center justify-between rounded-xl px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_26px_-10px_rgba(122,10,134,0.6)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#860a86]/30 active:scale-[0.98]"
                style={{ background: "linear-gradient(180deg, #8a0a8e, #6f0a80)" }}
              >
                Get started
                <Icon
                  name="arrow"
                  className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5"
                  stroke={2}
                />
              </Link>
              <Link
                to="/login"
                className="rounded-lg px-1 py-1 text-[15px] font-medium text-[#7d5f8c] transition-colors hover:text-[#3b0a4d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#860a86]/20"
              >
                Skip
              </Link>
            </div>

            <div
              className="wl-rise mt-10 h-px bg-[#ece6f1]"
              style={{ "--d": "300ms" }}
            />

            <ul className="mt-8 space-y-5">
              {FEATURES.map((f, i) => (
                <li
                  key={f.title}
                  className="wl-rise flex items-start gap-4"
                  style={{ "--d": `${400 + i * 130}ms` }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f0fa] text-[#860a86]">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#3b0a4d]">
                      {f.title}
                    </p>
                    <p className="text-sm text-[#7d5f8c]">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}