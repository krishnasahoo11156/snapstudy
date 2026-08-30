import { useState } from "react";

const CARD_COLORS = ["#FFF8E7", "#FFF0F5", "#F0F4FF", "#F0FFF4"];

export default function FlashcardsWorkspace({ cards, chapter }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [difficult, setDifficult] = useState(new Set());
  const [fullscreen, setFullscreen] = useState(false);
  const [cardList, setCardList] = useState(cards || []);

  const card = cardList[current];
  const total = cardList.length;

  const next = () => {
    setFlipped(false);
    setTimeout(() => setCurrent(c => Math.min(c + 1, total - 1)), 150);
  };
  const prev = () => {
    setFlipped(false);
    setTimeout(() => setCurrent(c => Math.max(c - 1, 0)), 150);
  };
  const flip = () => setFlipped(f => !f);
  const shuffle = () => {
    const arr = [...cardList].sort(() => Math.random() - 0.5);
    setCardList(arr);
    setCurrent(0);
    setFlipped(false);
  };
  const toggleDifficult = () => {
    setDifficult(prev => {
      const next = new Set(prev);
      if (next.has(card.id)) next.delete(card.id);
      else next.add(card.id);
      return next;
    });
  };

  const bgColor = CARD_COLORS[current % CARD_COLORS.length];

  if (!card) return (
    <div className="flex-1 flex items-center justify-center text-ink-tertiary">
      No flashcards available.
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col items-center justify-center bg-paper-warm px-6 py-8 ${fullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      {/* Card counter */}
      <p className="text-xs font-semibold text-ink-tertiary tracking-widest uppercase mb-6">
        CARD {current + 1} / {total}
        {difficult.has(card.id) && (
          <span className="ml-3 text-red-500 font-medium">🔴 Marked Difficult</span>
        )}
      </p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {cardList.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFlipped(false); setCurrent(i); }}
            className={`rounded-full transition-all ${
              i === current ? "w-5 h-2 bg-accent" : difficult.has(cardList[i]?.id) ? "w-2 h-2 bg-red-400" : "w-2 h-2 bg-paper-border"
            }`}
          />
        ))}
      </div>

      {/* Flashcard with 3D flip */}
      <div className="flex items-center gap-6 w-full max-w-2xl">
        {/* Prev */}
        <button
          id="flashcard-prev"
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-paper-border bg-white shadow-sm hover:border-accent hover:text-accent disabled:opacity-30 transition-all shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Card */}
        <div
          className="perspective-1000 flex-1 cursor-pointer"
          onClick={flip}
          id="flashcard-main"
        >
          <div
            className={`transform-style-3d relative transition-all duration-500 ${flipped ? "rotate-y-180" : ""}`}
            style={{ height: 280 }}
          >
            {/* Front */}
            <div
              className="backface-hidden absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-10 shadow-card border border-paper-border"
              style={{ background: bgColor }}
            >
              {card.card_type && (
                <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-widest mb-4 bg-white/60 px-3 py-1 rounded-full">
                  {{
                    derivation_steps: "DERIVATION",
                    labeled_diagram: "DIAGRAM",
                    qa: "DEFINITION",
                    timeline: "PROCESS",
                  }[card.card_type] || "FLASHCARD"}
                </span>
              )}
              <p className="text-xl font-semibold text-ink text-center leading-relaxed">
                {card.front}
              </p>
              <div className="mt-8 flex items-center gap-1.5 text-ink-tertiary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <span className="text-xs">Click to reveal answer</span>
              </div>
            </div>

            {/* Back */}
            <div
              className="backface-hidden rotate-y-180 absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-10 shadow-card border border-accent/20 bg-white"
            >
              <div className="text-center">
                <p className="text-base text-ink-secondary leading-relaxed mb-4">{card.back}</p>
                {card.steps && (
                  <div className="mt-3 space-y-2 text-left">
                    {card.steps.map((step, i) => (
                      <div key={i} className="flex gap-2.5 text-sm text-ink">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i+1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="mt-6 text-xs text-accent flex items-center gap-1 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View source from your note
              </button>
            </div>
          </div>
        </div>

        {/* Next */}
        <button
          id="flashcard-next"
          onClick={next}
          disabled={current === total - 1}
          className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-paper-border bg-white shadow-sm hover:border-accent hover:text-accent disabled:opacity-30 transition-all shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Show Answer button */}
      {!flipped && (
        <button
          id="flashcard-show-answer"
          onClick={flip}
          className="mt-8 flex items-center gap-2 bg-ink text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-ink/80 transition-colors shadow-sm"
        >
          Show Answer
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mt-6">
        <button
          id="flashcard-shuffle"
          onClick={shuffle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-paper-border bg-white text-sm text-ink-secondary hover:bg-paper-warm hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Shuffle
        </button>
        <button
          id="flashcard-mark-difficult"
          onClick={toggleDifficult}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${
            difficult.has(card?.id)
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-paper-border bg-white text-ink-secondary hover:bg-paper-warm hover:text-ink"
          }`}
        >
          <svg className="w-4 h-4" fill={difficult.has(card?.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Mark Difficult
        </button>
        <button
          id="flashcard-fullscreen"
          onClick={() => setFullscreen(f => !f)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-paper-border bg-white text-sm text-ink-secondary hover:bg-paper-warm hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Full Screen
        </button>
      </div>
    </div>
  );
}
