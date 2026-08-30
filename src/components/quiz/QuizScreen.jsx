import { useState } from "react";
import FlashcardQa from "../study/FlashcardQa";
import FlashcardDerivation from "../study/FlashcardDerivation";
import FlashcardDiagram from "../study/FlashcardDiagram";
import FlashcardTimeline from "../study/FlashcardTimeline";
import RemediationScreen from "../remediation/RemediationScreen";
import { generateMockRemediation, generateMockRegions } from "../../data/mock-data";
import { api } from "../../lib/api-client";
import { saveQuizSession } from "../../lib/firestore";

/** Route to correct flashcard component by card_type */
function CardRenderer({ card, onFlipped }) {
  switch (card.card_type) {
    case "derivation_steps": return <FlashcardDerivation card={card} onFlipped={onFlipped} />;
    case "labeled_diagram":  return <FlashcardDiagram card={card} onFlipped={onFlipped} />;
    case "timeline":         return <FlashcardTimeline card={card} onFlipped={onFlipped} />;
    case "qa":
    default:                 return <FlashcardQa card={card} onFlipped={onFlipped} />;
  }
}

/**
 * QuizScreen — one-card-at-a-time quiz flow.
 *
 * @param {{
 *   deck: object,
 *   cards: import("../../types").Flashcard[],
 *   regions?: import("../../types").Region[],
 *   photoUrl?: string,
 *   onExit: () => void
 * }} props
 */
export default function QuizScreen({ deck, cards, regions = [], photoUrl, onExit }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [responses, setResponses] = useState([]);
  const [showRemediation, setShowRemediation] = useState(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = cards[index];
  const progress = ((index) / cards.length) * 100;
  const effectiveRegions = regions && regions.length > 0 ? regions : generateMockRegions().regions;

  const recordResponse = async (correct) => {
    const newResponses = [
      ...responses,
      {
        cardId: card.id,
        correct,
        timeSpentMs: 0,
        userAnswer: correct ? card.back : "Need assistance / incorrect answer",
      },
    ];
    setResponses(newResponses);

    if (!correct) {
      // Find linked region from user notes
      const matchedRegion =
        effectiveRegions.find((r) => r.id === card.source_region_id) || effectiveRegions[0];

      setLoadingRemediation(true);
      try {
        const cleanBase64 = photoUrl?.replace(/^data:image\/\w+;base64,/, "") || "";
        const remRes = await api.remediate({
          wrongAnswer: "Need help reviewing this concept",
          correctAnswer: card.back,
          regionContext: matchedRegion,
          cardType: card.card_type,
          originalImageBase64: cleanBase64,
          box_2d: matchedRegion?.box_2d,
        });

        const remediationData =
          remRes.success && remRes.data ? remRes.data : generateMockRemediation();

        setShowRemediation({
          card,
          region: matchedRegion,
          wrongAnswer: "Need help reviewing this concept",
          remediation: remediationData,
        });
      } catch (err) {
        console.warn("[remediation error, using fallback]", err);
        setShowRemediation({
          card,
          region: matchedRegion,
          wrongAnswer: "Need help reviewing this concept",
          remediation: generateMockRemediation(),
        });
      } finally {
        setLoadingRemediation(false);
      }
      return;
    }

    advance(newResponses);
  };

  const advance = (resp) => {
    if (index + 1 >= cards.length) {
      setFinished(true);

      // Persist completed quiz session to Firestore
      const correctCount = (resp || responses).filter((r) => r.correct).length;
      saveQuizSession({
        id: `quiz_${Date.now()}`,
        deckId: deck.id || "deck_custom",
        scorePercent: Math.round((correctCount / cards.length) * 100),
        startedAt: new Date(),
        completedAt: new Date(),
        responses: resp || responses,
      }).catch((e) => console.warn("Failed to persist quiz session:", e));
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  const handleRemediationDone = () => {
    setShowRemediation(null);
    advance(responses);
  };

  if (loadingRemediation) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-full border-4 border-paper-border" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-accent border-r-accent/40 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-ink">Analyzing Your Notes</h3>
        <p className="mt-1 text-xs text-amber-700 font-medium">
          Gemini AI is finding the exact section in your handwritten notes…
        </p>
      </div>
    );
  }

  if (showRemediation) {
    return (
      <RemediationScreen
        card={showRemediation.card}
        region={showRemediation.region}
        wrongAnswer={showRemediation.wrongAnswer}
        remediation={showRemediation.remediation}
        photoUrl={photoUrl}
        onContinue={handleRemediationDone}
      />
    );
  }

  if (finished) {
    const correct = responses.filter((r) => r.correct).length;
    const pct = Math.round((correct / cards.length) * 100);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-paper-warm/95 backdrop-blur-md animate-fade-in text-ink overflow-y-auto">
        <div className="w-full max-w-md text-center my-auto">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 border border-accent/20 shadow-card">
            <span className="text-3xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</span>
          </div>
          <h2 className="text-2xl font-bold text-ink">Quiz Complete!</h2>
          <p className="mt-2 text-ink-secondary">{deck.title}</p>

          <div className="mt-6 rounded-3xl p-8 border border-paper-border bg-white shadow-card">
            <div className="text-5xl font-extrabold text-accent">{pct}%</div>
            <p className="mt-2 text-sm text-ink-secondary">{correct} of {cards.length} correct</p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              id="quiz-retry-btn"
              onClick={() => { setIndex(0); setResponses([]); setFlipped(false); setFinished(false); }}
              className="flex-1 rounded-xl border border-paper-border bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-paper-warm transition-colors shadow-sm"
            >
              Retry
            </button>
            <button
              id="quiz-exit-btn"
              onClick={onExit}
              className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ink/80 transition-all"
            >
              Done & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-warm text-ink animate-fade-in overflow-y-auto">
      {/* Immersive Top Bar */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-paper-border bg-white/90 px-6 backdrop-blur-md">
        <button
          id="quiz-back-btn"
          onClick={onExit}
          className="flex items-center gap-2 rounded-xl border border-paper-border bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-warm transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Exit Quiz
        </button>

        {/* Center: Title & Progress Bar */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-ink uppercase tracking-wider truncate max-w-xs md:max-w-md">
              {deck.title || "Note Quiz Session"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-32 md:w-48 overflow-hidden rounded-full bg-paper-border">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-medium text-ink-tertiary">
              {index + 1} / {cards.length}
            </span>
          </div>
        </div>

        {/* Right: Card Type Badge */}
        <span className="hidden sm:inline-flex rounded-lg border border-paper-border bg-paper-warm px-3 py-1 text-xs font-semibold text-ink-secondary">
          {card.card_type.replace("_", " ")}
        </span>
      </header>

      {/* Main Focus Area */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto w-full">
        <div className="w-full flex flex-col justify-center my-auto">
          {/* Card Container */}
          <CardRenderer card={card} onFlipped={(f) => setFlipped(f)} />

          {/* Action Buttons — shown after flip */}
          {flipped ? (
            <div className="mt-8 flex gap-4 animate-slide-up max-w-md mx-auto w-full">
              <button
                id="quiz-need-help-btn"
                onClick={() => recordResponse(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 shadow-sm transition-all"
              >
                <span>✗</span> Need Help / Wrong
              </button>
              <button
                id="quiz-got-it-btn"
                onClick={() => recordResponse(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm transition-all"
              >
                <span>✓</span> Got It!
              </button>
            </div>
          ) : (
            <p className="mt-6 text-center text-xs text-ink-tertiary animate-pulse">
              💡 Tap or click anywhere on the card to flip and check answer
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
