import RegionOverlay from "../region-overlay/RegionOverlay";

/**
 * RemediationScreen — the centerpiece of SnapStudy.
 * Shows exactly WHERE in the student's notes the answer was, and WHY they were wrong.
 *
 * @param {{
 *   card: import("../../types").Flashcard,
 *   region: import("../../types").Region,
 *   wrongAnswer: string,
 *   remediation: import("../../types").RemediationResult,
 *   photoUrl?: string,
 *   onContinue: () => void
 * }} props
 */
export default function RemediationScreen({
  card,
  region,
  wrongAnswer,
  remediation,
  photoUrl,
  onContinue,
}) {
  return (
    <div className="min-h-full animate-fade-in">
      {/* Header banner */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-amber-500/10 px-6 py-3 text-amber-300 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <span>🔍</span>
          <span>Grounded AI Note Remediation — Reviewing your source notes</span>
        </span>
        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] text-amber-200 border border-amber-500/30">
          {region?.label || "Source Region"}
        </span>
      </div>

      {/* Mobile: stacked / Desktop: side-by-side */}
      <div className="flex min-h-full flex-col lg:flex-row">
        {/* ── Left Panel: Source Region on Real Note Photo ─────────────── */}
        <div className="flex flex-col bg-slate-900/60 p-6 lg:w-1/2 lg:border-r lg:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <span>📍</span>
              <span>Exact Location in Your Notes</span>
            </span>
            <span className="rounded-lg bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
              {region?.region_type || "Note Region"}
            </span>
          </div>

          {/* Real Photo with interactive/highlighted bounding box overlay */}
          {photoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl">
              <RegionOverlay
                src={photoUrl}
                regions={region ? [region] : []}
                selectedRegionId={region?.id}
                interactive={false}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6 text-center flex flex-col items-center justify-center min-h-48">
              <p className="text-xs font-mono text-slate-300 leading-relaxed italic">
                "{region?.raw_text || "Notebook note region"}"
              </p>
            </div>
          )}

          {/* Region caption */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
            <p className="font-semibold text-slate-200">{region?.label}</p>
            {region?.raw_text && (
              <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                "{region.raw_text}"
              </p>
            )}
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
