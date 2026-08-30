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
    <div className="min-h-full animate-fade-in bg-paper text-ink">
      {/* Header banner */}
      <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-3 text-amber-800 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <span>🔍</span>
          <span>Grounded AI Note Remediation — Reviewing your source notes</span>
        </span>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] text-amber-800 border border-amber-300">
          {region?.label || "Source Region"}
        </span>
      </div>

      {/* Mobile: stacked / Desktop: side-by-side */}
      <div className="flex min-h-full flex-col lg:flex-row">
        {/* ── Left Panel: Source Region on Real Note Photo ─────────────── */}
        <div className="flex flex-col bg-paper-warm p-6 lg:w-1/2 lg:border-r lg:border-paper-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <span>📍</span>
              <span>Exact Location in Your Notes</span>
            </span>
            <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {region?.region_type || "Note Region"}
            </span>
          </div>

          {/* Real Photo with interactive/highlighted bounding box overlay */}
          {photoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-paper-border bg-white shadow-card">
              <RegionOverlay
                src={photoUrl}
                regions={region ? [region] : []}
                selectedRegionId={region?.id}
                interactive={false}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden rounded-2xl border border-paper-border bg-white p-6 text-center flex flex-col items-center justify-center min-h-48 shadow-card">
              <p className="text-xs font-mono text-ink-secondary leading-relaxed italic">
                "{region?.raw_text || "Notebook note region"}"
              </p>
            </div>
          )}

          {/* Region caption */}
          <div className="rounded-xl border border-paper-border bg-white p-3 text-xs shadow-sm">
            <p className="font-semibold text-ink">{region?.label}</p>
            {region?.raw_text && (
              <p className="text-[11px] text-ink-secondary mt-1 italic line-clamp-2">
                "{region.raw_text}"
              </p>
            )}
          </div>
        </div>

        {/* ── Right Panel: Explanation ─────────────────────────────────── */}
        <div className="flex flex-col justify-between p-6 lg:w-1/2 bg-white">
          <div>
            {/* Wrong answer */}
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-1">
                Your answer
              </p>
              <p className="text-sm text-red-800 font-medium">{wrongAnswer}</p>
            </div>

            {/* Correct answer */}
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
                Correct answer
              </p>
              <p className="text-sm text-emerald-800 font-medium">{card.back}</p>
            </div>

            {/* AI Explanation */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-tertiary">
                Explanation
              </p>
              <div className="rounded-2xl p-4 bg-paper-warm border border-paper-border">
                <p className="text-sm text-ink leading-relaxed">
                  {remediation.explanation}
                </p>
              </div>
            </div>

            {/* Hints */}
            {remediation.hints && remediation.hints.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-tertiary">
                  Hints
                </p>
                <ul className="space-y-2">
                  {remediation.hints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl bg-accent/5 border border-accent/20 px-3 py-2.5">
                      <span className="text-accent shrink-0">💡</span>
                      <p className="text-xs text-ink-secondary">{hint}</p>
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
            className="mt-6 w-full rounded-2xl bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-ink/80 transition-all"
          >
            Got it, continue →
          </button>
        </div>
      </div>
    </div>
  );
}
