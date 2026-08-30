import { useState, useEffect } from "react";
import { generateMockCards } from "../../data/mock-data";
import QuizScreen from "../quiz/QuizScreen";
import { FIREBASE_CONFIGURED, db } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { useOffline } from "../../hooks/useOffline";

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
  { id: "deck_0", title: "Mathematics — Quadratic Equations", subject: "Math", emoji: "📐", cardCount: 4, masteredCount: 1, lastStudied: "Today", color: "from-blue-600 to-violet-600" },
  { id: "deck_1", title: "Physics — Newton's Laws", subject: "Physics", emoji: "⚛️", cardCount: 8, masteredCount: 5, lastStudied: "Yesterday", color: "from-emerald-600 to-teal-600" },
  { id: "deck_2", title: "Chemistry — Periodic Table", subject: "Chem", emoji: "🧪", cardCount: 12, masteredCount: 3, lastStudied: "2 days ago", color: "from-orange-600 to-rose-600" },
];

export default function StudyDashboard() {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [realDecks, setRealDecks] = useState(null); // null = not yet loaded
  const [syncing, setSyncing] = useState(false);
  const isOffline = useOffline();
  const [user] = FIREBASE_CONFIGURED ? useAuth() : [null];

  // B10: Firestore real-time listener — loads PhotoRecord decks for the signed-in user
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !user) return;

    setSyncing(true);
    const q = query(
      collection(db, "photos"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const decks = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title || "Untitled Notes",
          subject: d.subject || "Notes",
          emoji: d.emoji || "📓",
          cardCount: (d.cards || []).length,
          masteredCount: 0, // will be populated from quizSessions in future
          lastStudied: d.createdAt?.toDate
            ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                Math.round((d.createdAt.toDate() - Date.now()) / 86400000),
                "day"
              )
            : "Recently",
          color: "from-blue-600 to-violet-600",
          cards: d.cards || [],
          photoUrl: d.originalPhotoUrl || null,
        };
      });
      setRealDecks(decks);
      setSyncing(false);
    }, () => {
      // On error, fall back to mocks
      setRealDecks(null);
      setSyncing(false);
    });

    return () => unsub();
  }, [user]);

  const decks = realDecks !== null ? realDecks : MOCK_DECKS;
  const usingMocks = realDecks === null;

  if (activeQuiz) {
    const cards = activeQuiz.cards?.length ? activeQuiz.cards : generateMockCards().cards;
    return (
      <QuizScreen
        deck={activeQuiz}
        cards={cards}
        onExit={() => setActiveQuiz(null)}
      />
    );
  }

  const recentDeck = decks[0] || MOCK_DECKS[0];

  return (
    <div className="min-h-full p-6 animate-fade-in">
      {/* Header with sync/offline indicators */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Study Dashboard</h2>
            <p className="mt-1 text-sm text-slate-400">
              {decks.reduce((acc, d) => acc + d.cardCount, 0)} cards across {decks.length} decks
              {usingMocks && <span className="ml-2 text-xs text-amber-400/70">(demo data)</span>}
            </p>
          </div>
          {/* Sync / Offline status badge */}
          {syncing && !isOffline && (
            <div className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
              <svg className="h-3 w-3 animate-sync-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Syncing…
            </div>
          )}
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
              <span>📴</span> Offline
            </div>
          )}
        </div>
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
          {decks.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 p-12 text-center">
              <span className="text-4xl">📷</span>
              <p className="text-sm font-medium text-slate-300">No decks yet</p>
              <p className="text-xs text-slate-500">Capture your first notes to create a study deck</p>
            </div>
          ) : decks.map((deck) => {
            const mastery = deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;
            return (
              <div
                key={deck.id}
                className="glass-card group cursor-pointer rounded-2xl p-5 transition-all duration-200 hover:border-slate-600/60 hover:shadow-lg"
                onClick={() => setActiveQuiz(deck)}
                id={`deck-card-${deck.id}`}
              >
                {/* Thumbnail — real photo or styled gradient fallback */}
                <div className={`relative mb-4 h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br ${deck.color} opacity-85 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center border border-slate-700/30`}>
                  {deck.photoUrl ? (
                    <img src={deck.photoUrl} alt={deck.title} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transform group-hover:scale-110 transition-transform duration-200">
                          {deck.emoji}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Subject badge & Progress */}
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
