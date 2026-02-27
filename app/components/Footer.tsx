export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-semibold">BumpLogic</div>
          <p className="text-sm opacity-70 mt-2 leading-relaxed">
            Package-aware root cause recommendation engine for WLP / bumping defects.
            Built as an engineering decision-support prototype.
          </p>
        </div>

        <div>
          <div className="font-semibold">About</div>
          <p className="text-sm opacity-70 mt-2 leading-relaxed">
            Created by <b>Thurkhesan Murugan</b> based on fab experience in Taiwan.
            Focus areas: defect signature analysis, tool correlation, SPC behavior, containment logic.
          </p>
        </div>

        <div>
          <div className="font-semibold">Notes</div>
          <ul className="text-sm opacity-70 mt-2 space-y-1">
            <li>• No customer/confidential data included</li>
            <li>• Logic framework is deterministic + explainable</li>
            <li>• Future: add more defect modes + package types</li>
          </ul>
        </div>
      </div>

      <div className="py-4 text-center text-xs opacity-60">
        © {new Date().getFullYear()} BumpLogic • Engineering prototype
      </div>
    </footer>
  );
}