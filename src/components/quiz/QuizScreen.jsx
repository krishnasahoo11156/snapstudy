import { useState } from "react";
import FlashcardQa from "../study/FlashcardQa";
import FlashcardDerivation from "../study/FlashcardDerivation";
import FlashcardDiagram from "../study/FlashcardDiagram";
import FlashcardTimeline from "../study/FlashcardTimeline";
import RemediationScreen from "../remediation/RemediationScreen";
import { generateMockRemediation } from "../../data/mock-data";
import { generateMockRegions } from "../../data/mock-data";

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
 * @param {{ deck: object, cards: import("../../types").Flashcard[], onExit: () => void }} props
 */
export default function QuizScreen({ deck, cards, onExit }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [responses, setResponses] = useState([]);
  const [showRemediation, setShowRemediation] = useState(null);
  const [finished, setFinished] = useState(false);

  const card = cards[index];
  const progress = ((index) / cards.length) * 100;
  const regions = generateMockRegions().regions;

  const recordResponse = (correct) => {
    const newResponses = [...responses, { cardId: card.id, correct, timeSpentMs: 0, userAnswer: correct ? card.back : "Incorrect" }];
    setResponses(newResponses);

    if (!correct) {
      // Trigger remediation
      const region = regions.find((r) => r.id === card.source_region_id) || regions[0];
      setShowRemediation({ card, region, wrongAnswer: "My incorrect answer" });
      return;
    }

    advance(newResponses);
  };

  const advance = (resp) => {
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  const handleRemediationDone = () => {
    setShowRemediation(null);
    advance(responses);
  };

  if (showRemediation) {
    return (
      <RemediationScreen
        card={showRemediation.card}
        region={showRemediation.region}
        wrongAnswer={showRemediation.wrongAnswer}
        remediation={generateMockRemediation()}
        onContinue={handleRemediationDone}
      />
    );
  }

  if (finished) {
    const correct = responses.filter((r) => r.correct).length;
    const pct = Math.round((correct / cards.length) * 100);
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl shadow-blue-500/25">
            <span className="text-3xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Quiz Complete!</h2>
          <p className="mt-2 text-slate-400">{deck.title}</p>

          <div className="mt-6 glass-card rounded-2xl p-6">
            <div className="text-5xl font-bold gradient-text">{pct}%</div>
            <p className="mt-1 text-sm text-slate-400">{correct} of {cards.length} correct</p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              id="quiz-retry-btn"
              onClick={() => { setIndex(0); setResponses([]); setFlipped(false); setFinished(false); }}
              className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Retry
            </button>
            <button
              id="quiz-exit-btn"
              onClick={onExit}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-violet-500 transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          id="quiz-back-btn"
          onClick={onExit}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <span className="text-sm font-medium text-slate-400">
          Card <span className="text-slate-200">{index + 1}</span> of {cards.length}
        </span>
        <div className="h-1.5 w-20 rounded-full bg-slate-700">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Card type badge */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {card.card_type.replace("_", " ")}
          </span>
        </div>

        <CardRenderer card={card} onFlipped={(f) => setFlipped(f)} />

        {/* Action Buttons — shown after flip */}
        {flipped && (
          <div className="mt-6 flex gap-3 animate-slide-up">
            <button
              id="quiz-need-help-btn"
              onClick={() => recordResponse(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
            >
              <span>✗</span> Need Help
            </button>
            <button
              id="quiz-got-it-btn"
              onClick={() => recordResponse(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <span>✓</span> Got It!
            </button>
          </div>
        )}

        {!flipped && (
          <p className="mt-4 text-center text-xs text-slate-600 animate-pulse-slow">
            Tap the card to reveal the answer
          </p>
        )}
      </div>
    </div>
  );
}
