"use client";

import { useEffect, useMemo, useState } from "react";

type Verdict = "STOP" | "HOLD" | "RELEASE";
type Risk = "HIGH" | "MED" | "LOW";
type PackageType = "BP" | "EP";

type LocationSig = "EDGE_BAND" | "CENTER" | "ACROSS";
type Morphology = "HAZE_FILM" | "RANDOM_ISLANDS" | "STREAKS" | "RING";
type ToolCorr = "SINGLE" | "MULTI" | "UNKNOWN";
type TimeBehavior = "STEP_CHANGE" | "INTERMITTENT" | "DRIFT";
type AcrossLot = "ONE_LOT" | "MULTI_LOT";
type ChemAge = "FRESH" | "MID" | "LATE";
type Evidence = "NOT_DONE" | "METAL_CONFIRMED" | "ORGANIC" | "SALT_OXIDE";
type Severity = "LOW" | "MED" | "HIGH";

type ProcessStep =
  | "POST_ETCH_CLEAN"
  | "POST_STRIP_DESCUM"
  | "POST_EP_RINSE_DRY"
  | "BP_MODULE"
  | "FINAL_INSPECTION";

type ChangeFlag =
  | "POST_PM_OR_PARTS"
  | "NEW_PR_BATCH"
  | "FILTER_DP_HIGH_OR_CHANGE"
  | "RECIPE_CHANGE"
  | "HANDLING_CHANGE"
  | "PRODUCT_MIX_CHANGE";

type CauseId =
  | "RINSE_DRY_BOUNDARY"
  | "WETTING_ORGANIC_CONTAM"
  | "PARTICLE_SHEDDING"
  | "REDEPOSITION_TRAPPED_CHEM"
  | "PR_STRIP_SCUM"
  | "BP_TRANSFER_NOZZLE"
  | "BP_HANDLER_CONTACT"
  | "EP_BATH_AGING_ADDITIVES"
  | "EP_ANODE_FILTER_PARTICLES"
  | "EP_MICROLOADING_TRANSPORT";

type GateKey =
  | "AOI_MONITORS_PASS"
  | "SEM_EDS_DONE"
  | "CORRECTIVE_ACTION_DONE"
  | "POST_FIX_MONITORS_PASS"
  | "BRIDGING_RISK_CLEARED";

type CaseInput = {
  pkg: PackageType;
  processStep: ProcessStep;

  location: LocationSig;
  morphology: Morphology;
  denseBias: boolean;
  severity: Severity;

  toolCorr: ToolCorr;
  timeBehavior: TimeBehavior;
  acrossLot: AcrossLot;

  changes: Record<ChangeFlag, boolean>;
  chemAge: ChemAge;

  evidence: Evidence;
  bridgingRisk: boolean;
};

type TestCard = {
  test: string;
  signal: string;
  means: string;
  next: string;
};

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeToPercent(scores: Array<{ id: CauseId; score: number }>) {
  const shifted = scores.map((s) => ({ ...s, score: Math.max(0, s.score) }));
  const sum = shifted.reduce((acc, s) => acc + s.score, 0);
  if (sum <= 0) {
    const eq = 100 / shifted.length;
    return shifted.map((s) => ({ ...s, pct: eq }));
  }
  return shifted.map((s) => ({ ...s, pct: (s.score / sum) * 100 }));
}

const CAUSE_LIBRARY: Record<
  CauseId,
  { title: string; short: string; pkgBias?: Partial<Record<PackageType, number>>; tests: TestCard[] }
> = {
  RINSE_DRY_BOUNDARY: {
    title: "Rinse/Dry boundary non-uniformity",
    short: "Edge/ring haze from rinse/drain/dry transient or non-uniform drying.",
    tests: [
      {
        test: "Monitor split: normal vs +2× DI rinse + dry tweak (N2 knife / spin / time)",
        signal: "Edge/ring haze drops with boosted rinse/dry",
        means: "Boundary/dry mechanism likely",
        next: "Lock optimized rinse/dry; verify hardware; gate-release after clean monitors",
      },
    ],
  },
  WETTING_ORGANIC_CONTAM: {
    title: "Wetting failure / organic contamination",
    short: "Water-break/contact angle shift leaves thin film; often post-maintenance or handling.",
    tests: [
      {
        test: "Water-break / contact angle on affected vs baseline",
        signal: "Poor wetting / patchy film formation",
        means: "Organic contamination/wetting failure",
        next: "Clean/refresh; tighten handling; gate-release after monitors pass",
      },
    ],
  },
  PARTICLE_SHEDDING: {
    title: "Particle shedding (filter/seals/nozzles/parts)",
    short: "Random islands/specks; intermittent; often single tool or post-parts change.",
    tests: [
      {
        test: "Inspect filters/DP trend + check seals/nozzles/lines",
        signal: "DP spike / debris found / part swap correlates",
        means: "Particle source confirmed",
        next: "Replace/clean source; run monitors; quarantine window until pass",
      },
    ],
  },
  REDEPOSITION_TRAPPED_CHEM: {
    title: "Redeposition / trapped chemistry in features",
    short: "Density dependence; trapped chem re-deposits; rinse inefficiency in features.",
    pkgBias: { EP: 1.15 },
    tests: [
      {
        test: "Dense vs sparse comparison + enhanced rinse/clean split",
        signal: "Dense-bias reduces with enhanced clean",
        means: "Transport/trap mechanism",
        next: "Implement enhanced clean; monitor trend; gate-release",
      },
    ],
  },
  PR_STRIP_SCUM: {
    title: "PR/strip/descum residue masquerading as metal residue",
    short: "Micro-scum looks like residue after downstream; density bias common.",
    tests: [
      {
        test: "Split: old PR vs new PR AND standard vs boosted strip/descum",
        signal: "Defect tracks PR batch or strip strength",
        means: "PR/strip incompatibility",
        next: "Block PR lot; tune strip/descum; re-qualify before release",
      },
    ],
  },
  BP_TRANSFER_NOZZLE: {
    title: "BP: placement head/nozzle transfer contamination",
    short: "Islands/transfer-like marks from head/nozzle/contact surfaces.",
    pkgBias: { BP: 1.25 },
    tests: [
      {
        test: "BP transfer monitor: run dummy then inspect",
        signal: "Transfer signature repeats",
        means: "Placement head/nozzle contamination",
        next: "Clean/replace nozzle/head; verify with clean monitors; gate-release",
      },
    ],
  },
  BP_HANDLER_CONTACT: {
    title: "BP: handler/contact surface contamination",
    short: "Localized islands where contact/handling occurs; intermittent across lots.",
    pkgBias: { BP: 1.15 },
    tests: [
      {
        test: "Map defect vs contact points; inspect trays/end-effectors",
        signal: "Defects align with contact points",
        means: "Handling contamination",
        next: "Replace/clean contact hardware; retrain handling; gate-release",
      },
    ],
  },
  EP_BATH_AGING_ADDITIVES: {
    title: "EP: bath aging / additive breakdown",
    short: "Drift across days; density dependence; correlates to bath age/additive health.",
    pkgBias: { EP: 1.35 },
    tests: [
      {
        test: "Pull bath health + correlate to drift start",
        signal: "OOC bath parameter aligns with drift",
        means: "Bath aging/additive breakdown",
        next: "Refresh bath/additives; verify with monitors; gate-release",
      },
    ],
  },
  EP_ANODE_FILTER_PARTICLES: {
    title: "EP: anode bag / filter / pump particle source",
    short: "Islands/specks; intermittent; can spike after maintenance or DP events.",
    pkgBias: { EP: 1.25 },
    tests: [
      {
        test: "Inspect anode bags/filters/pumps; check DP events",
        signal: "Debris found; DP spike aligns",
        means: "EP particle source confirmed",
        next: "Replace bags/filters; flush; run clean monitors; gate-release",
      },
    ],
  },
  EP_MICROLOADING_TRANSPORT: {
    title: "EP: microloading / transport limitation",
    short: "Dense patterns worse; features trap chem; linked to plating/clean transport.",
    pkgBias: { EP: 1.35 },
    tests: [
      {
        test: "Dense vs sparse split + adjust agitation/flow (within spec)",
        signal: "Dense-bias reduces with improved transport",
        means: "Microloading/transport limitation",
        next: "Optimize transport; enhance post-plate rinse; gate-release after monitors",
      },
    ],
  },
};

function scoreCauses(input: CaseInput) {
  const triggers: string[] = [];
  const base: Record<CauseId, number> = {
    RINSE_DRY_BOUNDARY: 10,
    WETTING_ORGANIC_CONTAM: 10,
    PARTICLE_SHEDDING: 10,
    REDEPOSITION_TRAPPED_CHEM: 10,
    PR_STRIP_SCUM: 10,
    BP_TRANSFER_NOZZLE: 10,
    BP_HANDLER_CONTACT: 10,
    EP_BATH_AGING_ADDITIVES: 10,
    EP_ANODE_FILTER_PARTICLES: 10,
    EP_MICROLOADING_TRANSPORT: 10,
  };

  const add = (id: CauseId, w: number, why: string) => {
    base[id] += w;
    triggers.push(`${CAUSE_LIBRARY[id].title}: +${w} (${why})`);
  };

  if (input.processStep === "BP_MODULE") {
    add("BP_TRANSFER_NOZZLE", 25, "Process step=BP module");
    add("BP_HANDLER_CONTACT", 15, "BP module handling/contact");
    base.EP_BATH_AGING_ADDITIVES *= 0.55;
    base.EP_ANODE_FILTER_PARTICLES *= 0.65;
    base.EP_MICROLOADING_TRANSPORT *= 0.65;
    triggers.push("EP causes: down-weighted (found at BP module)");
  }

  if (input.location === "EDGE_BAND") {
    add("RINSE_DRY_BOUNDARY", 28, "Location=edge band");
    add("WETTING_ORGANIC_CONTAM", 14, "Edge sensitive to wetting/dry boundary");
  }

  if (input.morphology === "RANDOM_ISLANDS") {
    add("PARTICLE_SHEDDING", 22, "Morphology=random islands");
    add("EP_ANODE_FILTER_PARTICLES", 10, "Islands can be EP particles");
    add("BP_TRANSFER_NOZZLE", 10, "Islands can be BP transfer");
  }

  if (input.denseBias) {
    add("EP_MICROLOADING_TRANSPORT", 24, "Dense pattern bias");
    add("REDEPOSITION_TRAPPED_CHEM", 18, "Dense areas trap chemistry");
    add("PR_STRIP_SCUM", 12, "Dense bias can be scum/strip issue");
  }

  if (input.toolCorr === "SINGLE") {
    add("PARTICLE_SHEDDING", 16, "Single-tool correlation");
    add("BP_TRANSFER_NOZZLE", 10, "Single module correlation (BP)");
    add("EP_ANODE_FILTER_PARTICLES", 10, "Single module correlation (EP)");
  }

  if (input.timeBehavior === "STEP_CHANGE" && input.changes.POST_PM_OR_PARTS) {
    add("PARTICLE_SHEDDING", 18, "Step-change after PM/parts");
    add("RINSE_DRY_BOUNDARY", 12, "PM can affect coverage/uniformity");
    add("WETTING_ORGANIC_CONTAM", 10, "PM can introduce organics");
  }

  if (input.acrossLot === "MULTI_LOT") {
    add("EP_BATH_AGING_ADDITIVES", 10, "Multiple lots implies systemic");
    add("RINSE_DRY_BOUNDARY", 6, "Coverage issues repeat across lots");
  }

  if (input.changes.NEW_PR_BATCH) add("PR_STRIP_SCUM", 26, "New PR batch");
  if (input.changes.FILTER_DP_HIGH_OR_CHANGE) {
    add("PARTICLE_SHEDDING", 18, "Filter DP high/change");
    add("EP_ANODE_FILTER_PARTICLES", 12, "EP loop filtration events");
  }
  if (input.changes.HANDLING_CHANGE) {
    add("BP_HANDLER_CONTACT", 18, "Handling change");
    add("WETTING_ORGANIC_CONTAM", 10, "Handling can add organics");
  }

  if (input.evidence === "ORGANIC") {
    add("WETTING_ORGANIC_CONTAM", 35, "EDS=organic");
    add("PR_STRIP_SCUM", 26, "EDS=organic/scum likely");
    base.EP_BATH_AGING_ADDITIVES *= 0.35;
    base.EP_ANODE_FILTER_PARTICLES *= 0.45;
    base.EP_MICROLOADING_TRANSPORT *= 0.55;
    triggers.push("Metal-heavy EP causes: down-weighted (EDS=organic)");
  }

  if (input.evidence === "SALT_OXIDE") {
    add("RINSE_DRY_BOUNDARY", 16, "EDS=salt/oxide often rinse/dry residue");
    add("REDEPOSITION_TRAPPED_CHEM", 12, "Oxide/salt can be trapped chemistry");
    base.BP_TRANSFER_NOZZLE *= 0.7;
    triggers.push("BP transfer: slightly down-weighted (EDS=salt/oxide)");
  }

  if (input.evidence === "METAL_CONFIRMED") {
    add("EP_ANODE_FILTER_PARTICLES", 18, "EDS=metal; particles possible");
    add("REDEPOSITION_TRAPPED_CHEM", 16, "EDS=metal; redeposition possible");
    add("BP_TRANSFER_NOZZLE", 12, "EDS=metal; transfer contamination possible");
  }

  for (const id of Object.keys(base) as CauseId[]) {
    const mult = CAUSE_LIBRARY[id].pkgBias?.[input.pkg] ?? 1;
    base[id] *= mult;
  }

  const scored = (Object.keys(base) as CauseId[]).map((id) => ({ id, score: base[id] }));
  const top3 = normalizeToPercent(scored)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((x) => ({ id: x.id, pct: x.pct }));

  const stopNow =
    input.bridgingRisk ||
    (input.evidence === "METAL_CONFIRMED" && input.severity === "HIGH");

  const baseVerdict: Verdict = stopNow ? "STOP" : "HOLD";

  let risk: Risk = "HIGH";
  if (!stopNow) {
    if (input.severity === "LOW" && input.evidence !== "METAL_CONFIRMED") risk = "MED";
    if (input.severity === "LOW" && input.evidence === "ORGANIC" && !input.bridgingRisk) risk = "LOW";
  }

  return { top3, triggers, baseVerdict, risk };
}

function buildFirstMoves(input: CaseInput, top3: Array<{ id: CauseId; pct: number }>) {
  const moves: string[] = [];

  if (input.bridgingRisk || input.evidence === "METAL_CONFIRMED") {
    moves.push("STOP/HOLD WIP in suspect time window; block downstream steps that amplify bridging/short risk.");
  } else {
    moves.push("HOLD suspect time window; add edge-inclusive AOI + extra sampling until gate passes.");
  }

  moves.push("Run AOI with edge-inclusive recipe + capture signature (edge vs center, dense vs sparse).");

  if (input.evidence === "NOT_DONE") {
    moves.push("Do SEM + EDS on worst sites: dense + sparse + edge band; classify metal vs organic vs salt/oxide.");
  } else {
    moves.push("Confirm mechanism: repeat SEM/EDS on 1–2 wafers across regions (not one-off).");
  }

  const top = top3[0]?.id;
  if (top === "RINSE_DRY_BOUNDARY") {
    moves.push("Monitor split: normal vs +2× DI rinse + dry tweak (spin/N2 knife/time); compare edge/ring response.");
  } else if (top === "PARTICLE_SHEDDING" || top === "EP_ANODE_FILTER_PARTICLES") {
    moves.push("Check filters/DP + inspect parts; after cleanup run 2 clean monitors.");
  } else if (top === "PR_STRIP_SCUM") {
    moves.push("Material/strip split: PR batch + boosted strip/descum; re-inspect before restart.");
  } else if (top === "EP_BATH_AGING_ADDITIVES") {
    moves.push("Pull EP bath health + DP; correlate to drift; refresh bath/additives then verify monitors.");
  } else if (top === "EP_MICROLOADING_TRANSPORT" || top === "REDEPOSITION_TRAPPED_CHEM") {
    moves.push("Split: standard vs enhanced rinse/clean (and/or agitation/flow within spec); compare dense vs sparse.");
  } else if (top === "BP_TRANSFER_NOZZLE" || top === "BP_HANDLER_CONTACT") {
    moves.push("BP check: run dummy/monitor; inspect transfer signature; clean/replace contact surfaces.");
  } else {
    moves.push("Run monitor split: normal vs extended rinse/dry; isolate boundary vs contamination.");
  }

  return moves.slice(0, 4);
}

function requiredGateKeys(input: CaseInput): GateKey[] {
  const req: GateKey[] = ["AOI_MONITORS_PASS", "CORRECTIVE_ACTION_DONE", "POST_FIX_MONITORS_PASS"];
  if (input.evidence === "NOT_DONE") req.push("SEM_EDS_DONE");
  if (input.bridgingRisk || input.evidence === "METAL_CONFIRMED") req.push("BRIDGING_RISK_CLEARED");
  return req;
}

function computeFinalVerdict(baseVerdict: Verdict, gate: Record<GateKey, boolean>, req: GateKey[]) {
  return req.every((k) => gate[k]) ? ("RELEASE" as Verdict) : baseVerdict;
}

function buildConfirmationMatrix(top3: Array<{ id: CauseId; pct: number }>) {
  return top3.slice(0, 3).map((t) => CAUSE_LIBRARY[t.id].tests[0]);
}

function formatOutput(
  input: CaseInput,
  scored: ReturnType<typeof scoreCauses>,
  finalVerdict: Verdict,
  gate: Record<GateKey, boolean>,
  reqGate: GateKey[]
) {
  const { top3, risk, baseVerdict } = scored;

  const snap = [
    `Package: ${input.pkg} | Step found: ${input.processStep}`,
    `Signature: ${input.location} + ${input.morphology} + denseBias=${input.denseBias ? "Y" : "N"} + severity=${input.severity}`,
    `Correlation: tool=${input.toolCorr}, time=${input.timeBehavior}, acrossLot=${input.acrossLot}`,
    `Chem age: ${input.chemAge} | Evidence: ${input.evidence} | Bridging risk: ${input.bridgingRisk ? "Y" : "N"}`,
    `Changes: ${
      Object.entries(input.changes)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ") || "None selected"
    }`,
  ];

  const causes = top3
    .map((x, i) => `${i + 1}) ${CAUSE_LIBRARY[x.id].title} — ${x.pct.toFixed(0)}%`)
    .join("\n");

  const moves = buildFirstMoves(input, top3).map((m) => `- ${m}`).join("\n");

  // ✅ IMPORTANT: remove markdown-table formatting from text output
  // (Matrix will be rendered as UI cards instead)
  const matrixText = buildConfirmationMatrix(top3)
    .map((r, i) => `${i + 1}) Test: ${r.test}\n   Signal: ${r.signal}\n   Means: ${r.means}\n   Next: ${r.next}`)
    .join("\n\n");

  const gateLines = reqGate
    .map((k) => {
      const done = gate[k];
      const name =
        k === "AOI_MONITORS_PASS"
          ? "2 consecutive monitor wafers pass AOI (edge-inclusive)"
          : k === "SEM_EDS_DONE"
          ? "SEM/EDS classification completed"
          : k === "CORRECTIVE_ACTION_DONE"
          ? "Corrective action applied (tool/bath/clean/handling)"
          : k === "POST_FIX_MONITORS_PASS"
          ? "Post-fix monitors pass (no recurrence)"
          : "Bridging risk cleared (ppm under limit / no bridge indicators)";
      return `- [${done ? "x" : " "}] ${name}`;
    })
    .join("\n");

  return (
    `0) Decision Now (1 line)\n` +
    `   **${finalVerdict}** (base=${baseVerdict}, metal residue risk=${risk})\n\n` +
    `1) Snapshot (max 5 bullets)\n` +
    snap.slice(0, 5).map((s) => `- ${s}`).join("\n") +
    `\n\n2) Top 3 Causes (ranked + %, sum 100)\n` +
    causes +
    `\n\n3) First 4 Moves (next 8 hours)\n` +
    moves +
    `\n\n4) Confirmation Matrix (Rendered as UI cards)\n` +
    matrixText +
    `\n\n5) Release Gate Checklist (required items)\n` +
    gateLines
  );
}

function labelChange(k: ChangeFlag) {
  switch (k) {
    case "POST_PM_OR_PARTS":
      return "Post-PM / parts change";
    case "NEW_PR_BATCH":
      return "New PR batch";
    case "FILTER_DP_HIGH_OR_CHANGE":
      return "Filter DP high / filter change";
    case "RECIPE_CHANGE":
      return "Recipe change";
    case "HANDLING_CHANGE":
      return "Operator/handling change";
    case "PRODUCT_MIX_CHANGE":
      return "Product mix change";
  }
}

function labelStep(s: ProcessStep) {
  switch (s) {
    case "POST_ETCH_CLEAN":
      return "Post-etch clean";
    case "POST_STRIP_DESCUM":
      return "Post-strip / descum";
    case "POST_EP_RINSE_DRY":
      return "Post-EP rinse/dry";
    case "BP_MODULE":
      return "BP module (placement/handler)";
    case "FINAL_INSPECTION":
      return "Final inspection";
  }
}

function labelGate(k: GateKey) {
  switch (k) {
    case "AOI_MONITORS_PASS":
      return "2 consecutive monitors pass AOI (edge-inclusive)";
    case "SEM_EDS_DONE":
      return "SEM/EDS completed";
    case "CORRECTIVE_ACTION_DONE":
      return "Corrective action applied";
    case "POST_FIX_MONITORS_PASS":
      return "Post-fix monitors pass";
    case "BRIDGING_RISK_CLEARED":
      return "Bridging risk cleared";
  }
}

/** ✅ NEW: Pretty futuristic matrix UI */
function MatrixGrid({ rows }: { rows: TestCard[] }) {
  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-black/35 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-white/60">Confirmation Matrix</div>
        <div className="text-[11px] text-white/40">Rendered UI (not markdown)</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((r, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/50 mb-1">Test</div>
            <div className="text-sm text-white/85 font-medium">{r.test}</div>

            <div className="mt-3 text-xs text-white/50 mb-1">Signal</div>
            <div className="text-sm text-white/80">{r.signal}</div>

            <div className="mt-3 text-xs text-white/50 mb-1">Means</div>
            <div className="text-sm text-white/80">{r.means}</div>

            <div className="mt-3 text-xs text-white/50 mb-1">Next</div>
            <div className="text-sm text-white/80">{r.next}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WarRoom() {
  const LINKEDIN_URL = "https://www.linkedin.com/in/thurkhesan/";

  // Inputs
  const [pkg, setPkg] = useState<PackageType>("BP");
  const [processStep, setProcessStep] = useState<ProcessStep>("BP_MODULE");

  const [location, setLocation] = useState<LocationSig>("EDGE_BAND");
  const [morphology, setMorphology] = useState<Morphology>("RANDOM_ISLANDS");
  const [denseBias, setDenseBias] = useState(false);
  const [severity, setSeverity] = useState<Severity>("MED");

  const [toolCorr, setToolCorr] = useState<ToolCorr>("SINGLE");
  const [timeBehavior, setTimeBehavior] = useState<TimeBehavior>("STEP_CHANGE");
  const [acrossLot, setAcrossLot] = useState<AcrossLot>("MULTI_LOT");

  const [chemAge, setChemAge] = useState<ChemAge>("MID");
  const [evidence, setEvidence] = useState<Evidence>("NOT_DONE");
  const [bridgingRisk, setBridgingRisk] = useState(true);

  const [changes, setChanges] = useState<Record<ChangeFlag, boolean>>({
    POST_PM_OR_PARTS: true,
    NEW_PR_BATCH: false,
    FILTER_DP_HIGH_OR_CHANGE: false,
    RECIPE_CHANGE: false,
    HANDLING_CHANGE: false,
    PRODUCT_MIX_CHANGE: false,
  });

  // Gate checklist
  const [gate, setGate] = useState<Record<GateKey, boolean>>({
    AOI_MONITORS_PASS: false,
    SEM_EDS_DONE: false,
    CORRECTIVE_ACTION_DONE: false,
    POST_FIX_MONITORS_PASS: false,
    BRIDGING_RISK_CLEARED: false,
  });

  // Outputs
  const [output, setOutput] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [whyText, setWhyText] = useState<string>("");

  const badgeClasses = useMemo(() => {
    if (!verdict) return "bg-white/10 text-white border-white/10";
    if (verdict === "STOP") return "bg-red-500/15 text-red-200 border-red-500/30";
    if (verdict === "HOLD") return "bg-yellow-400/15 text-yellow-200 border-yellow-400/30";
    return "bg-green-500/15 text-green-200 border-green-500/30";
  }, [verdict]);

  const buildInput = (): CaseInput => ({
    pkg,
    processStep,
    location,
    morphology,
    denseBias,
    severity,
    toolCorr,
    timeBehavior,
    acrossLot,
    changes,
    chemAge,
    evidence,
    bridgingRisk,
  });

  // ✅ Matrix rows used for UI
  const matrixRows = useMemo(() => {
    if (!output) return [];
    const inp = buildInput();
    const scored = scoreCauses(inp);
    return buildConfirmationMatrix(scored.top3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    output,
    pkg,
    processStep,
    location,
    morphology,
    denseBias,
    severity,
    toolCorr,
    timeBehavior,
    acrossLot,
    chemAge,
    evidence,
    bridgingRisk,
    changes,
  ]);

  const Toggle = ({
    value,
    onChange,
    label,
    hint,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
    label: string;
    hint?: string;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={classNames(
        "w-full rounded-xl border px-4 py-3 text-left transition",
        value ? "border-green-400/40 bg-green-500/10" : "border-white/10 bg-black/35 hover:bg-white/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/85">{label}</div>
          {hint && <div className="text-xs text-white/45 mt-1">{hint}</div>}
        </div>
        <div
          className={classNames(
            "h-6 w-11 rounded-full border flex items-center px-1 transition",
            value ? "border-green-400/50 bg-green-500/20 justify-end" : "border-white/15 bg-white/5 justify-start"
          )}
        >
          <div className={classNames("h-4 w-4 rounded-full", value ? "bg-green-300" : "bg-white/40")} />
        </div>
      </div>
    </button>
  );

  const Checkbox = ({ k }: { k: ChangeFlag }) => {
    const v = changes[k];
    return (
      <button
        type="button"
        onClick={() => setChanges((p) => ({ ...p, [k]: !p[k] }))}
        className={classNames(
          "rounded-xl border px-3 py-2 text-xs transition text-left",
          v ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
        )}
      >
        {labelChange(k)}
      </button>
    );
  };

  const requiredKeysPreview = useMemo(() => requiredGateKeys(buildInput()), [
    pkg,
    processStep,
    location,
    morphology,
    denseBias,
    severity,
    toolCorr,
    timeBehavior,
    acrossLot,
    chemAge,
    evidence,
    bridgingRisk,
    changes,
  ]);

  const GateItem = ({ k }: { k: GateKey }) => {
    const v = gate[k];
    const required = requiredKeysPreview.includes(k);
    return (
      <button
        type="button"
        onClick={() => setGate((p) => ({ ...p, [k]: !p[k] }))}
        className={classNames(
          "w-full rounded-xl border px-4 py-3 text-left transition",
          v ? "border-green-400/40 bg-green-500/10" : "border-white/10 bg-black/35 hover:bg-white/5"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/85">
              {labelGate(k)} {required && <span className="text-xs text-red-200/80 ml-2">(required)</span>}
            </div>
            <div className="text-xs text-white/45 mt-1">{v ? "Done ✅" : "Not done yet"}</div>
          </div>
          <div
            className={classNames(
              "mt-0.5 rounded-full border px-2 py-0.5 text-[11px]",
              v ? "border-green-400/30 text-green-200" : "border-white/10 text-white/60"
            )}
          >
            {v ? "PASS" : "PENDING"}
          </div>
        </div>
      </button>
    );
  };

  const recompute = () => {
    const inp = buildInput();
    const scored = scoreCauses(inp);
    const req = requiredGateKeys(inp);
    const finalV = computeFinalVerdict(scored.baseVerdict, gate, req);
    setVerdict(finalV);
    setRisk(scored.risk);
    setOutput(formatOutput(inp, scored, finalV, gate, req));
    setWhyText(scored.triggers.slice(0, 12).join("\n") || "No triggers logged.");
  };

  const generate = () => {
    setIsThinking(true);
    setCopied(false);

    const cleanGate: Record<GateKey, boolean> = {
      AOI_MONITORS_PASS: false,
      SEM_EDS_DONE: false,
      CORRECTIVE_ACTION_DONE: false,
      POST_FIX_MONITORS_PASS: false,
      BRIDGING_RISK_CLEARED: false,
    };

    setGate(cleanGate);

    setTimeout(() => {
      const inp = buildInput();
      const scored = scoreCauses(inp);
      const req = requiredGateKeys(inp);
      const finalV = computeFinalVerdict(scored.baseVerdict, cleanGate, req);

      setVerdict(finalV);
      setRisk(scored.risk);
      setOutput(formatOutput(inp, scored, finalV, cleanGate, req));
      setWhyText(scored.triggers.slice(0, 12).join("\n") || "No triggers logged.");
      setIsThinking(false);
    }, 350);
  };

  const clear = () => {
    setOutput("");
    setVerdict(null);
    setRisk(null);
    setCopied(false);
    setIsThinking(false);
    setShowWhy(false);
    setGate({
      AOI_MONITORS_PASS: false,
      SEM_EDS_DONE: false,
      CORRECTIVE_ACTION_DONE: false,
      POST_FIX_MONITORS_PASS: false,
      BRIDGING_RISK_CLEARED: false,
    });
  };

  const copyOut = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  useEffect(() => {
    if (!output) return;
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gate,
    pkg,
    processStep,
    location,
    morphology,
    denseBias,
    severity,
    toolCorr,
    timeBehavior,
    acrossLot,
    chemAge,
    evidence,
    bridgingRisk,
    changes,
  ]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05070d] text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#05070d]" />
        <div className="absolute inset-0 bg-wafer-grid" />
        <div className="absolute inset-0 bg-wafer-rings" />
        <div className="absolute -top-40 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-56 right-[-120px] h-[760px] w-[760px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-noise" />
        <div className="absolute inset-0 bg-vignette" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-300 border border-green-500/20">
            Package-Aware Root Cause Recommendation Engine — Metal Residue (Full Form + Auto Gate Refresh)
          </div>

          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-green-400 via-cyan-300 to-green-200 bg-clip-text text-transparent">
              BumpLogic
            </span>{" "}
            <span className="text-white/80">— Metal Residue War Room</span>
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
              Created by <span className="text-green-300 font-medium">Thurkhesan Murugan</span> • Fab Experience — Taiwan 🇹🇼
            </div>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10 transition"
              title="Open LinkedIn"
            >
              LinkedIn ↗
            </a>
          </div>

          <p className="mt-2 text-sm text-white/55">
            Auto-updates verdict/output as you tick gate items or change signature inputs — no refresh button.
          </p>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="relative rounded-2xl panel-fab p-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-400/12" />
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />

            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={classNames("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", badgeClasses)}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {verdict ? `Verdict: ${verdict}` : "Verdict: —"}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    Risk: {risk ?? "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clear}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={generate}
                    className="rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 px-5 py-2 text-sm font-semibold shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:shadow-[0_0_45px_rgba(34,197,94,0.35)] hover:scale-[1.02] transition"
                  >
                    {isThinking ? "Analyzing…" : "Analyze"}
                  </button>
                </div>
              </div>

              {/* Package */}
              <div className="mb-4">
                <label className="block text-xs text-white/60 mb-2">Package Type</label>
                <select
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value as PackageType)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                >
                  <option value="BP">BP (Ball Placement)</option>
                  <option value="EP">EP (Electroplated)</option>
                </select>
              </div>

              {/* Process Step */}
              <div className="mb-4">
                <label className="block text-xs text-white/60 mb-2">Process Step Found (Context)</label>
                <select
                  value={processStep}
                  onChange={(e) => setProcessStep(e.target.value as ProcessStep)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                >
                  <option value="POST_ETCH_CLEAN">{labelStep("POST_ETCH_CLEAN")}</option>
                  <option value="POST_STRIP_DESCUM">{labelStep("POST_STRIP_DESCUM")}</option>
                  <option value="POST_EP_RINSE_DRY">{labelStep("POST_EP_RINSE_DRY")}</option>
                  <option value="BP_MODULE">{labelStep("BP_MODULE")}</option>
                  <option value="FINAL_INSPECTION">{labelStep("FINAL_INSPECTION")}</option>
                </select>
              </div>

              {/* Signature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-2">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as LocationSig)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="EDGE_BAND">Edge band</option>
                    <option value="CENTER">Center</option>
                    <option value="ACROSS">Across wafer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Morphology</label>
                  <select
                    value={morphology}
                    onChange={(e) => setMorphology(e.target.value as Morphology)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="HAZE_FILM">Haze / film</option>
                    <option value="RANDOM_ISLANDS">Random islands</option>
                    <option value="STREAKS">Streaks</option>
                    <option value="RING">Ring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="LOW">Low</option>
                    <option value="MED">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Toggle
                    value={denseBias}
                    onChange={setDenseBias}
                    label="Dense pattern worse"
                    hint="If dense areas show higher residue/island count"
                  />
                </div>
              </div>

              {/* Correlation */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-2">Tool correlation</label>
                  <select
                    value={toolCorr}
                    onChange={(e) => setToolCorr(e.target.value as ToolCorr)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="SINGLE">Single tool</option>
                    <option value="MULTI">Multiple tools</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Time behavior</label>
                  <select
                    value={timeBehavior}
                    onChange={(e) => setTimeBehavior(e.target.value as TimeBehavior)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="STEP_CHANGE">Step-change</option>
                    <option value="INTERMITTENT">Intermittent</option>
                    <option value="DRIFT">Drift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Across-lot</label>
                  <select
                    value={acrossLot}
                    onChange={(e) => setAcrossLot(e.target.value as AcrossLot)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="ONE_LOT">One lot</option>
                    <option value="MULTI_LOT">Multiple lots</option>
                  </select>
                </div>
              </div>

              {/* Chem & evidence */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-2">Chemistry age</label>
                  <select
                    value={chemAge}
                    onChange={(e) => setChemAge(e.target.value as ChemAge)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="FRESH">Fresh</option>
                    <option value="MID">Mid</option>
                    <option value="LATE">Late</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">SEM/EDS evidence</label>
                  <select
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value as Evidence)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/70"
                  >
                    <option value="NOT_DONE">Not done</option>
                    <option value="METAL_CONFIRMED">Metal confirmed</option>
                    <option value="ORGANIC">Organic</option>
                    <option value="SALT_OXIDE">Salt / oxide</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <Toggle
                  value={bridgingRisk}
                  onChange={setBridgingRisk}
                  label="Bridging risk"
                  hint="If residue could cause shorts/bridge (high risk)"
                />
              </div>

              {/* Recent changes */}
              <div className="mt-6">
                <div className="text-xs text-white/60 mb-2">Recent changes</div>
                <div className="flex flex-wrap gap-2">
                  <Checkbox k="POST_PM_OR_PARTS" />
                  <Checkbox k="NEW_PR_BATCH" />
                  <Checkbox k="FILTER_DP_HIGH_OR_CHANGE" />
                  <Checkbox k="RECIPE_CHANGE" />
                  <Checkbox k="HANDLING_CHANGE" />
                  <Checkbox k="PRODUCT_MIX_CHANGE" />
                </div>
              </div>

              {/* Explainability */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowWhy((s) => !s)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition"
                >
                  <div className="text-sm text-white/85">Explainability (Why)</div>
                  <div className="text-xs text-white/45 mt-1">{showWhy ? "Hide triggers" : "Show top triggers"}</div>
                </button>

                {showWhy && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/45 p-4">
                    <div className="text-xs text-white/60 mb-2">Top triggers (debug)</div>
                    <pre className="whitespace-pre-wrap text-[12px] leading-5 text-white/70 font-mono">
                      {whyText || "Run Analyze to generate triggers."}
                    </pre>
                  </div>
                )}
              </div>

              {/* Gate checklist */}
              <div className="mt-6">
                <div className="text-xs text-white/60 mb-2">Release Gate Checklist</div>
                <div className="grid grid-cols-1 gap-3">
                  {(Object.keys(gate) as GateKey[]).map((k) => (
                    <GateItem key={k} k={k} />
                  ))}
                </div>
                <div className="mt-3 text-xs text-white/45">
                  When all <span className="text-red-200/80">required</span> items are done, verdict becomes{" "}
                  <span className="text-green-200">RELEASE</span> automatically.
                </div>
              </div>

              <div className="mt-6 text-xs text-white/35">
                Tip: Click Analyze once, then tick gates as you execute the plan → watch verdict shift to RELEASE.
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="relative rounded-2xl panel-fab p-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-green-400/10" />
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background:linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:56px_56px]" />

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/60">War-room Output</div>
                <button
                  onClick={copyOut}
                  disabled={!output}
                  className={classNames(
                    "rounded-lg px-3 py-1 text-xs transition border",
                    output
                      ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      : "border-white/5 bg-white/5 text-white/30 cursor-not-allowed"
                  )}
                >
                  {copied ? "Copied ✅" : "Copy"}
                </button>
              </div>

              <div className="relative rounded-xl border border-white/10 bg-black/55 p-4 min-h-[720px] overflow-hidden">
                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-cyan-400/10" />
                <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-2xl" />

                {isThinking && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                )}

                {/* ✅ NEW: pretty matrix UI */}
                {matrixRows.length > 0 && <MatrixGrid rows={matrixRows} />}

                <pre className="relative whitespace-pre-wrap text-[13px] leading-6 text-green-200/90 font-mono">
                  {output ||
                    "No output yet.\n\n1) Fill the form\n2) Click Analyze\n3) Tick gate items as you complete checks\n\nVerdict/output will update automatically."}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-white/30">
          &copy; 2026 Thurkhesan Murugan • Fab Experience — Taiwan 🇹🇼
        </div>
      </div>
    </div>
  );
}