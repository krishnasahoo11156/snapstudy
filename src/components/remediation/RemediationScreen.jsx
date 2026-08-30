/**
 * RemediationScreen — the centerpiece of SnapStudy.
 * Shows exactly WHERE in the student's notes the answer was, and WHY they were wrong.
 *
 * @param {{
 *   card: import("../../types").Flashcard,
 *   region: import("../../types").Region,
 *   wrongAnswer: string,
 *   remediation: import("../../types").RemediationResult,
 *   onContinue: () => void
 * }} props
 */
export default function RemediationScreen({ card, region, wrongAnswer, remediation, onContinue }) {
  return (
    <div className="min-h-full animate-fade-in">
      {/* Mobile: stacked / Desktop: side-by-side */}
      <div className="flex min-h-full flex-col lg:flex-row">

        {/* ── Left Panel: Source Region ───────────────────────────────── */}
        <div className="flex flex-col bg-slate-800/50 p-6 lg:w-1/2 lg:border-r lg:border-slate-700/60">
          {/* Label */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">📍</span>
            <span className="text-sm font-semibold text-slate-300">From your notes:</span>
            <span className="ml-auto rounded-md bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
              {region.region_type}
            </span>
          </div>

          {/* Source crop placeholder — Branch A provides real crop via API */}
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 flex flex-col items-center justify-center min-h-40">
            {/* When real API is wired, replace this with: <img src={`data:image/jpeg;base64,${cropBase64}`} /> */}
            <div className="w-full p-5">
              <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/60 p-6 text-center">
                <p className="text-xs font-mono text-slate-400 leading-relaxed italic">
                  "{region.raw_text}"
                </p>
                <p className="mt-3 text-xs text-slate-600">
                  Branch A: replace with real cropped image
                </p>
              </div>
            </div>
          </div>

          {/* Region label */}
          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-200">{region.label}</p>
          </div>
        </div>

        {/* ── Right Panel: Explanation ─────────────────────────────────── */}
        <div className="flex flex-col justify-between p-6 lg:w-1/2">
          <div>
            {/* Wrong answer */}
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70 mb-1">
                Your answer
              </p>
              <p className="text-sm text-red-300">{wrongAnswer}</p>
            </div>

            {/* Correct answer */}
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/70 mb-1">
                Correct answer
              </p>
              <p className="text-sm text-emerald-300">{card.back}</p>
            </div>

            {/* AI Explanation */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Explanation
              </p>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-slate-200 leading-relaxed">
                  {remediation.explanation}
                </p>
              </div>
            </div>

            {/* Hints */}
            {remediation.hints && remediation.hints.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Hints
                </p>
                <ul className="space-y-2">
                  {remediation.hints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2.5">
                      <span className="text-blue-400 shrink-0">💡</span>
                      <p className="text-xs text-slate-300">{hint}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            id="remediation-continue-btn"
            onClick={onContinue}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-violet-500 transition-all"
          >
            Got it, continue →
          </button>
        </div>
      </div>
    </div>
  );
}
