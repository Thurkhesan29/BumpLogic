import CorporateSections from "./components/CorporateSections";
import Footer from "./components/Footer";
import WarRoom from "./components/WarRoom";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* GLOBAL WIDTH CONTAINER */}
      <div className="mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section className="pt-10">
          <div className="relative rounded-3xl border border-emerald-400/15 bg-white/5 backdrop-blur p-7 md:p-10 overflow-hidden">
            {/* green glow blob */}
            <div className="hero-glow" />

            {/* top chip */}
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full chip-fab">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.55)]" />
              <span className="opacity-90">
                Package-Aware Root Cause Recommendation Engine — Metal Residue
              </span>
              <span className="opacity-60">•</span>
              <span className="opacity-90">Explainable + War-room workflow</span>
            </div>

            <h1 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight">
              <span className="text-fab text-white">BumpLogic</span>{" "}
              <span className="text-white/65">— Metal Residue War Room</span>
            </h1>

            <p className="mt-3 text-sm md:text-base text-white/75 max-w-3xl leading-relaxed">
              Decision-support tool that converts defect signatures into ranked, explainable
              root-cause recommendations using gated correlation logic.
            </p>

            <div className="mt-6 flex gap-3 flex-wrap">
              <a
                href="#warroom"
                className="px-5 py-2.5 rounded-xl bg-emerald-400 text-black font-semibold text-sm shadow-xl shadow-emerald-400/20 hover:bg-emerald-300 transition active:scale-95"
              >
                ⚡ Open War Room
              </a>

              <a
                href="#about"
                className="px-5 py-2.5 rounded-xl border border-emerald-400/25 bg-black/25 hover:bg-emerald-400/10 text-sm text-white/90 transition"
              >
                About
              </a>

              <a
                href="https://www.linkedin.com/in/thurkhesan/"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl border border-white/10 bg-black/25 hover:border-emerald-400/25 hover:bg-emerald-400/10 text-sm text-white/80 transition"
              >
                LinkedIn ↗
              </a>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-4">
                <div className="text-xs text-emerald-200/70">Mode</div>
                <div className="text-sm font-semibold mt-1 text-white">
                  Metal Residue (BP/EP)
                </div>
                <div className="text-xs text-white/65 mt-1">
                  Morphology + location + correlation gates
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-4">
                <div className="text-xs text-emerald-200/70">Output</div>
                <div className="text-sm font-semibold mt-1 text-white">
                  Ranked Root Causes
                </div>
                <div className="text-xs text-white/65 mt-1">
                  Explainable scoring, not black-box
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-4">
                <div className="text-xs text-emerald-200/70">Workflow</div>
                <div className="text-sm font-semibold mt-1 text-white">
                  War-room Ready
                </div>
                <div className="text-xs text-white/65 mt-1">
                  Faster containment decisions
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORPORATE SECTIONS */}
        <CorporateSections />

        {/* WAR ROOM */}
        <section id="warroom" className="mt-10">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                War Room
              </h2>
              <p className="text-sm opacity-75 mt-1">
                Fill in the defect signature and correlation context. Output updates automatically.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <WarRoom />
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="mt-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-7">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              About this Project
            </h2>
            <p className="mt-3 text-sm opacity-80 leading-relaxed max-w-4xl">
              BumpLogic is built to demonstrate an engineering approach to defect excursions:
              structured logic, correlation-first thinking, and explainable prioritization. The
              project intentionally avoids confidential data and focuses on a reusable framework
              that can scale across defect modes and package contexts.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </div>
    </main>
  );
}