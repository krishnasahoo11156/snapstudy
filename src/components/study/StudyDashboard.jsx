import { useState } from "react";
import { generateMockCards } from "../../data/mock-data";
import QuizScreen from "../quiz/QuizScreen";

/** Progress ring SVG component */
function ProgressRing({ percent, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(51 65 85)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size * 0.22} fill="#94a3b8" fontWeight="600">
        {percent}%
      </text>
    </svg>
  );
}

const MOCK_DECKS = [
  { id: "deck_0", title: "Mathematics — Quadratic Equations", subject: "Math", cardCount: 4, masteredCount: 1, lastStudied: "Today", color: "from-blue-600 to-violet-600" },
  { id: "deck_1", title: "Physics — Newton's Laws", subject: "Physics", cardCount: 8, masteredCount: 5, lastStudied: "Yesterday", color: "from-emerald-600 to-teal-600" },
  { id: "deck_2", title: "Chemistry — Periodic Table", subject: "Chem", cardCount: 12, masteredCount: 3, lastStudied: "2 days ago", color: "from-orange-600 to-rose-600" },
];

export default function StudyDashboard() {
  const [activeQuiz, setActiveQuiz] = useState(null);

  if (activeQuiz) {
    return (
      <QuizScreen
        deck={activeQuiz}
        cards={generateMockCards().cards}
        onExit={() => setActiveQuiz(null)}
      />
    );
  }

  const recentDeck = MOCK_DECKS[0];

  return (
    <div className="min-h-full p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Study Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          {MOCK_DECKS.reduce((acc, d) => acc + d.cardCount, 0)} cards across {MOCK_DECKS.length} decks
        </p>
      </div>

      {/* Continue Studying CTA */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 p-6 shadow-xl shadow-blue-500/20">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white blur-2xl" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Continue Where You Left Off</p>
              <h3 className="text-lg font-bold text-white">{recentDeck.title}</h3>
              <p className="mt-1 text-sm text-blue-200">{recentDeck.cardCount - recentDeck.masteredCount} cards remaining</p>
            </div>
            <button
              id="continue-studying-btn"
              onClick={() => setActiveQuiz(recentDeck)}
              className="shrink-0 rounded-xl bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/30 transition-all"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>

      {/* Deck Grid */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Your Decks</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_DECKS.map((deck) => {
            const mastery = Math.round((deck.masteredCount / deck.cardCount) * 100);
            return (
              <div
                key={deck.id}
                className="glass-card group cursor-pointer rounded-2xl p-5 transition-all duration-200 hover:border-slate-600/60 hover:shadow-lg"
                onClick={() => setActiveQuiz(deck)}
                id={`deck-card-${deck.id}`}
              >
                {/* Subject badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-lg bg-gradient-to-r ${deck.color} px-2.5 py-1 text-xs font-semibold text-white`}>
                    {deck.subject}
                  </span>
                  <ProgressRing percent={mastery} />
                </div>

                <h4 className="font-semibold text-slate-100 text-sm leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                  {deck.title}
                </h4>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{deck.cardCount} cards · {deck.masteredCount} mastered</span>
                  <span>{deck.lastStudied}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
