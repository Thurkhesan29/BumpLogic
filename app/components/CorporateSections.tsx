export default function CorporateSections() {
  const cards = [
    {
      title: "Executive Overview",
      body: (
        <>
          <p>
            BumpLogic is a structured decision-support engine designed for wafer-level
            packaging (WLP) and bumping defect excursions.
          </p>
          <p>
            The system transforms field observations — morphology, location, severity,
            tool correlation, and lot behavior — into ranked root-cause recommendations
            using a deterministic logic framework.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1 text-sm opacity-90">
            <li>Rapid containment decisions</li>
            <li>Structured war-room discussions</li>
            <li>Cross-functional engineering alignment</li>
            <li>Reduced reaction-based troubleshooting</li>
          </ul>
          <p className="mt-3 text-sm opacity-80">
            Current implementation: <b>Metal Residue (BP / Ball Placement)</b>. Designed to scale to additional defect modes.
          </p>
        </>
      ),
    },
    {
      title: "How the Engine Works",
      body: (
        <ol className="list-decimal pl-5 space-y-2 text-sm opacity-90">
          <li>
            <b>Context Identification:</b> Package type and process module establish baseline risk assumptions.
          </li>
          <li>
            <b>Signature Mapping:</b> Morphology + location generate a defect signature vector.
          </li>
          <li>
            <b>Behavioral Correlation:</b> Tool-specific vs multi-tool, step-change vs gradual trend, single-lot vs multi-lot spread.
          </li>
          <li>
            <b>Risk Escalation Logic:</b> Gates classify excursions into Monitor / Hold / STOP containment.
          </li>
          <li>
            <b>Weighted Root Cause Ranking:</b> Root causes are scored and ranked based on correlation strength.
          </li>
        </ol>
      ),
    },
    {
      title: "Engineering Logic Framework",
      body: (
        <>
          <p className="text-sm opacity-90">
            The Metal Residue model incorporates deterministic rule weighting across:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1 text-sm opacity-90">
            <li>Edge-band contamination bias detection</li>
            <li>Dense island clustering behavior</li>
            <li>Tool-to-tool variance logic</li>
            <li>PM-cycle sensitivity / maintenance interval awareness</li>
            <li>Wet/Dry boundary risk mapping</li>
            <li>Placement head/nozzle contamination probability weighting</li>
          </ul>
          <p className="mt-3 text-sm opacity-80">
            Each condition adjusts probability weights to generate ranked output with a cumulative distribution.
          </p>
        </>
      ),
    },
    {
      title: "Manufacturing Impact",
      body: (
        <>
          <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
            <li>Reduce Mean Time to Containment (MTTC)</li>
            <li>Increase decision clarity during excursions</li>
            <li>Standardize root-cause prioritization</li>
            <li>Reduce unnecessary lot scrap due to reaction bias</li>
            <li>Support training for junior engineers in war-room scenarios</li>
          </ul>
          <p className="mt-3 text-sm opacity-80">
            Long-term objective: expand into a scalable <b>Package-Aware Defect Intelligence Platform</b>.
          </p>
        </>
      ),
    },
  ];

  return (
    <section className="mt-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              Engineering Brief
            </h2>
            <p className="text-sm opacity-75 mt-1">
              Corporate-style documentation to help recruiters and engineers understand the system.
            </p>
          </div>
          <div className="text-xs opacity-60">
            v0.1 • Metal Residue Model • BP Context
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-5">
  {cards.map((c) => (
    <div key={c.title} className="panel-pro">
      <div className="panel-head">
        <div className="flex items-center gap-2">
          <span className="badge-chip">
            {c.title === "Executive Overview" ? "📌" :
             c.title === "How the Engine Works" ? "⚙️" :
             c.title === "Engineering Logic Framework" ? "🧠" : "📈"}
          </span>
          <div className="text-sm font-semibold">{c.title}</div>
        </div>

        <span className="badge-chip">
          {c.title === "Executive Overview" ? "Impact" :
           c.title === "How the Engine Works" ? "Logic Flow" :
           c.title === "Engineering Logic Framework" ? "Framework" : "Ops"}
        </span>
      </div>

      <div className="p-5">
        <div className="space-y-3 text-sm leading-relaxed text-white/85">
          {c.body}
        </div>
      </div>
    </div>
  ))}
</div>
      </div>
    </section>
  );
}