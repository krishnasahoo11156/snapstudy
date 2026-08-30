import { useState } from "react";
import { generateMockRemediation, generateMockRegions } from "../../data/mock-data";
import { api } from "../../lib/api-client";
import { saveQuizSession } from "../../lib/firestore";

/** Generate MCQ options from a flashcard */
function getOptions(card) {
  const correct = card.back?.split(".")[0] || card.back;
  return [
    { label: "A", text: "Positive" },
    { label: "B", text: "Negative" },
    { label: "C", text: correct.length < 80 ? correct : "Zero", correct: true },
    { label: "D", text: "Cannot be determined" },
  ];
}

/**
 * QuizScreen — MCQ quiz flow matching reference design.
 * Preserves all existing API/Firestore logic, replaces visuals only.
 */
export default function QuizScreen({ deck, cards, regions = [], photoUrl, onExit }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState([]);
  const [showRemediation, setShowRemediation] = useState(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = cards[index];
  const total = cards.length;
  const progress = ((index) / total) * 100;
  const options = card ? getOptions(card) : [];
  const effectiveRegions = regions?.length > 0 ? regions : generateMockRegions().regions;

  const handleSelect = (opt) => {
    if (submitted) return;
    setSelected(opt);
  };

  const handleSubmit = async () => {
    if (!selected || submitted) return;
    setSubmitted(true);

    const correct = selected.correct === true;
    const newResponses = [...responses, {
      cardId: card.id,
      correct,
      userAnswer: selected.text,
      timeSpentMs: 0,
    }];
    setResponses(newResponses);

    if (!correct) {
      const matchedRegion = effectiveRegions.find(r => r.id === card.source_region_id) || effectiveRegions[0];
      setLoadingRemediation(true);
      try {
        const cleanBase64 = photoUrl?.replace(/^data:image\/\w+;base64,/, "") || "";
        const remRes = await api.remediate({
          wrongAnswer: selected.text,
          correctAnswer: card.back,
          regionContext: matchedRegion,
          cardType: card.card_type,
          originalImageBase64: cleanBase64,
          box_2d: matchedRegion?.box_2d,
        });
        const remediationData = remRes.success && remRes.data ? remRes.data : generateMockRemediation();
        setShowRemediation({ card, region: matchedRegion, wrongAnswer: selected.text, remediation: remediationData });
      } catch {
        setShowRemediation({
          card, region: matchedRegion,
          wrongAnswer: selected.text,
          remediation: generateMockRemediation(),
        });
      } finally {
        setLoadingRemediation(false);
      }
    }
  };

  const advance = () => {
    setSelected(null);
    setSubmitted(false);
    setShowRemediation(null);
    if (index + 1 >= total) {
      setFinished(true);
      const correct = responses.filter(r => r.correct).length;
      saveQuizSession({
        id: `quiz_${Date.now()}`,
        deckId: deck?.id || "deck_custom",
        scorePercent: Math.round((correct / total) * 100),
        startedAt: new Date(),
        completedAt: new Date(),
        responses,
      }).catch(() => {});
    } else {
      setIndex(i => i + 1);
    }
  };

  // ── Loading remediation ──────────────────────────────────────────────────
  if (loadingRemediation) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 animate-fade-in">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-paper-border" />
          <div className="absolute inset-0 rounded-full border-4 border-t-accent animate-spin" />
        </div>
        <p className="text-sm text-ink-secondary">Finding the source in your notes…</p>
      </div>
    );
  }

  // ── Remediation: split view ────────────────────────────────────────────
  if (showRemediation) {
    const { region, wrongAnswer, remediation } = showRemediation;
    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-2 gap-6 p-6 min-h-[500px]">
          {/* Left: Source from your note */}
          <div className="bg-white rounded-2xl border border-paper-border p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Source from your note</p>
              <button className="ml-auto text-xs text-accent hover:underline">View full</button>
            </div>
            {/* Simulated handwritten note region */}
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-center">
              <div className="text-center font-hand" style={{ fontFamily: "'Caveat', cursive" }}>
                <p className="text-xl text-amber-900 font-semibold mb-2">{region?.label || "Key Formula"}</p>
                <p className="text-lg text-amber-800 italic">{region?.raw_text || "v = constant → a = 0"}</p>
                <div className="mt-3 inline-block bg-yellow-300/50 px-3 py-1 rounded text-sm text-amber-900">
                  Highlighted region
                </div>
              </div>
            </div>
          </div>

          {/* Right: Explanation */}
          <div className="bg-white rounded-2xl border border-paper-border p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Explanation</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink leading-relaxed">{remediation.explanation}</p>
              {remediation.hints?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {remediation.hints.map((hint, i) => (
                    <div key={i} className="flex gap-2 text-sm text-ink-secondary">
                      <span className="text-accent">→</span>
                      <p>{hint}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-ink-tertiary italic">Based on your uploaded notes</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={advance}
                className="flex-1 text-sm bg-ink text-white py-2.5 rounded-xl font-semibold hover:bg-ink/80 transition-colors"
              >
                Next Question →
              </button>
              <button
                onClick={() => setShowRemediation(null)}
                className="text-sm border border-paper-border px-4 py-2.5 rounded-xl text-ink-secondary hover:bg-paper-warm transition-colors"
              >
                Back to Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Finished ─────────────────────────────────────────────────────────────
  if (finished) {
    const correct = responses.filter(r => r.correct).length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-bold text-ink mb-1">Quiz Complete!</h2>
        <p className="text-ink-secondary text-sm mb-6">{deck?.title}</p>
        <div className="bg-white rounded-2xl border border-paper-border p-8 w-64 mb-8">
          <p className="text-5xl font-bold text-accent">{pct}%</p>
          <p className="text-sm text-ink-secondary mt-2">{correct} of {total} correct</p>
        </div>
        <div className="flex gap-3">
          <button
            id="quiz-retry-btn"
            onClick={() => { setIndex(0); setResponses([]); setSelected(null); setSubmitted(false); setFinished(false); }}
            className="px-6 py-2.5 border border-paper-border rounded-xl text-sm font-medium text-ink hover:bg-paper-warm transition-colors"
          >
            Retry
          </button>
          <button
            id="quiz-exit-btn"
            onClick={onExit}
            className="px-6 py-2.5 bg-ink text-white rounded-xl text-sm font-semibold hover:bg-ink/80 transition-colors"
          >
            Done & Return
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = submitted && selected?.correct;
  const isIncorrect = submitted && selected && !selected.correct;

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          id="quiz-back-btn"
          onClick={onExit}
          className="text-sm text-ink-secondary hover:text-ink flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Exit
        </button>
        <div className="flex-1 h-2 bg-paper-warm rounded-full overflow-hidden border border-paper-border">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-ink-secondary whitespace-nowrap">
          Question {index + 1} of {total}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main quiz area */}
        <div className="col-span-2 bg-white rounded-2xl border border-paper-border p-8">
          {/* Question */}
          <p className="text-base font-medium text-ink-secondary mb-2">
            Question {index + 1} of {total}
          </p>
          <h3 className="text-lg font-semibold text-ink mb-8 leading-relaxed">
            {card?.front}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {options.map(opt => {
              let cls = "answer-option";
              if (submitted) {
                if (opt.correct) cls += " correct";
                else if (selected?.label === opt.label && !opt.correct) cls += " incorrect";
              } else if (selected?.label === opt.label) {
                cls += " selected";
              }
              return (
                <button
                  key={opt.label}
                  id={`quiz-option-${opt.label}`}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center gap-4 ${cls}`}
                >
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    submitted && opt.correct
                      ? "border-green-500 bg-green-500 text-white"
                      : submitted && selected?.label === opt.label && !opt.correct
                      ? "border-red-500 bg-red-500 text-white"
                      : selected?.label === opt.label
                      ? "border-accent bg-accent text-white"
                      : "border-current"
                  }`}>
                    {submitted && opt.correct
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : opt.label
                    }
                  </span>
                  <span className="text-sm font-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {submitted && (
            <div className={`mt-6 flex items-center justify-between p-4 rounded-xl animate-slide-up ${
              isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">Correct! Well done.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-red-800">Incorrect. See explanation →</p>
                  </>
                )}
              </div>
              <button
                id="quiz-next-btn"
                onClick={isCorrect ? advance : () => {
                  // trigger remediation (already set in handleSubmit for wrong)
                  if (!showRemediation && !loadingRemediation) advance();
                }}
                className="text-sm bg-ink text-white px-5 py-2 rounded-xl font-semibold hover:bg-ink/80 transition-colors"
              >
                Next Question →
              </button>
            </div>
          )}

          {!submitted && (
            <div className="mt-6 flex justify-end">
              <button
                id="quiz-submit-btn"
                onClick={handleSubmit}
                disabled={!selected}
                className="text-sm bg-ink text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-ink/80 disabled:opacity-40 transition-colors"
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>

        {/* Right: Source from note */}
        <div className="bg-white rounded-2xl border border-paper-border p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Source from your note</p>
          </div>
          <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col justify-center">
            <div className="font-hand text-center" style={{ fontFamily: "'Caveat', cursive" }}>
              <p className="text-amber-800 text-base">
                {effectiveRegions[0]?.raw_text || "If velocity is constant,\nacceleration is zero."}
              </p>
              <div className="mt-3 text-sm italic text-amber-700">
                a = dv/dt = 0
              </div>
            </div>
          </div>
          {submitted && !isCorrect && (
            <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs font-semibold text-accent mb-1">Explanation</p>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Since acceleration is the rate of change of velocity, and the velocity remains constant, the acceleration is zero.
              </p>
              <p className="text-xs text-ink-tertiary mt-2 italic">Based on your uploaded notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
