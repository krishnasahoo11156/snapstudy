import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getPhotoRecords, deletePhotoRecord } from "../../lib/firestore";
import { generateMockCards, generateMockRegions } from "../../data/mock-data";
import QuizScreen from "../quiz/QuizScreen";
import { StudyIcon, BookOpen } from "../ui/Icons";

const LOCAL_STORAGE_DELETED_DEFAULTS = "snapstudy_deleted_default_decks";

/** Progress ring SVG component */
function ProgressRing({ percent, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E3D8" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#7C3AED"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size * 0.22} fill="#57534E" fontWeight="600">
        {percent}%
      </text>
    </svg>
  );
}

const DEFAULT_DECKS = [
  { id: "deck_0", title: "Mathematics — Quadratic Equations", subject: "Math", emoji: "math", cardCount: 4, masteredCount: 1, lastStudied: "Today", color: "from-blue-600 to-violet-600", cards: generateMockCards().cards, regions: generateMockRegions().regions },
  { id: "deck_1", title: "Physics — Newton's Laws", subject: "Physics", emoji: "atom", cardCount: 8, masteredCount: 5, lastStudied: "Yesterday", color: "from-emerald-600 to-teal-600", cards: generateMockCards().cards, regions: generateMockRegions().regions },
  { id: "deck_2", title: "Chemistry — Periodic Table", subject: "Chem", emoji: "flask", cardCount: 12, masteredCount: 3, lastStudied: "2 days ago", color: "from-orange-600 to-rose-600", cards: generateMockCards().cards, regions: generateMockRegions().regions },
];

export default function StudyDashboard() {
  const [user] = useAuth();
  const uid = user?.id || user?.uid || "guest_user";
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [decks, setDecks] = useState([]);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDecks = async () => {
    try {
      const deletedDefaults = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DELETED_DEFAULTS) || "[]");
      const activeDefaults = DEFAULT_DECKS.filter((d) => !deletedDefaults.includes(d.id));

      const records = await getPhotoRecords(uid);
      if (records && records.length > 0) {
        const userDecks = records.map((rec, idx) => ({
          id: rec.id,
          isUserDeck: true,
          title: rec.regions?.[0]?.label ? `Notes: ${rec.regions[0].label}` : `Scanned Note Deck #${records.length - idx}`,
          subject: rec.regions?.[0]?.region_type?.toUpperCase() || "NOTES",
          emoji: "notes",
          cardCount: rec.cards?.length || 0,
          masteredCount: 0,
          lastStudied: "Just now",
          color: "from-indigo-600 to-cyan-600",
          cards: rec.cards || [],
          regions: rec.regions || [],
          photoUrl: rec.originalPhotoUrl || null,
        }));

        setDecks([...userDecks, ...activeDefaults]);
      } else {
        setDecks(activeDefaults);
      }
    } catch (err) {
      console.warn("Failed to load user decks:", err);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [uid]);

  const confirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    try {
      setIsDeleting(true);
      if (deckToDelete.isUserDeck) {
        await deletePhotoRecord(deckToDelete.id, user?.uid);
      } else {
        const deletedDefaults = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DELETED_DEFAULTS) || "[]");
        localStorage.setItem(LOCAL_STORAGE_DELETED_DEFAULTS, JSON.stringify([...deletedDefaults, deckToDelete.id]));
      }
      setDecks((prev) => prev.filter((d) => d.id !== deckToDelete.id));
      setDeckToDelete(null);
    } catch (err) {
      console.error("Failed to delete deck:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (activeQuiz) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <QuizScreen
          deck={activeQuiz}
          cards={activeQuiz.cards || generateMockCards().cards}
          regions={activeQuiz.regions || []}
          photoUrl={activeQuiz.photoUrl || null}
          onExit={() => setActiveQuiz(null)}
        />
      </div>
    );
  }

  const recentDeck = decks[0];

  return (
    <div className="min-h-full p-6 animate-fade-in bg-paper text-ink">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-ink">Study Dashboard</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {decks.reduce((acc, d) => acc + d.cardCount, 0)} cards across {decks.length} decks
        </p>
      </div>

      {/* Continue Studying CTA */}
      {recentDeck && (
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-6 shadow-card text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-tertiary mb-1">Continue Where You Left Off</p>
                <h3 className="text-lg font-bold text-white">{recentDeck.title}</h3>
                <p className="mt-1 text-sm text-ink-light">{recentDeck.cardCount - recentDeck.masteredCount} cards remaining</p>
              </div>
              <button
                id="continue-studying-btn"
                onClick={() => setActiveQuiz(recentDeck)}
                className="shrink-0 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-paper-warm transition-all shadow-sm"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Grid */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-tertiary">Your Decks</h3>
        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-paper-border bg-white shadow-card">
            <BookOpen className="w-10 h-10 text-accent mb-3" />
            <h4 className="text-lg font-bold text-ink">No note decks yet</h4>
            <p className="text-xs text-ink-secondary mt-1 max-w-sm">
              Use the Capture tab to scan handwritten notes and generate instant flashcards.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => {
              const mastery = deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;
              return (
                <div
                  key={deck.id}
                  className="bg-white border border-paper-border group relative cursor-pointer rounded-3xl p-5 transition-all duration-200 hover:shadow-card-hover hover:border-accent/40 shadow-card"
                  onClick={() => setActiveQuiz(deck)}
                  id={`deck-card-${deck.id}`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeckToDelete(deck);
                    }}
                    title="Delete note deck"
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-ink-secondary hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-paper-border backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>

                  {/* Thumbnail */}
                  <div className={`relative mb-4 h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-br ${deck.color} opacity-90 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center border border-paper-border`}>
                    {deck.photoUrl ? (
                      <img
                        src={deck.photoUrl}
                        alt={deck.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white transform group-hover:scale-110 transition-transform duration-200">
                            <StudyIcon name={deck.emoji} className="w-12 h-12 text-white/90 drop-shadow-md" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Subject badge & Progress */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-lg bg-paper-warm border border-paper-border px-2.5 py-1 text-xs font-semibold text-ink">
                      {deck.subject}
                    </span>
                    <ProgressRing percent={mastery} />
                  </div>

                  <h4 className="font-semibold text-ink text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2 pr-6">
                    {deck.title}
                  </h4>

                  <div className="mt-3 flex items-center justify-between text-xs text-ink-tertiary">
                    <span>{deck.cardCount} cards · {deck.masteredCount} mastered</span>
                    <span>{deck.lastStudied}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deckToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-paper-border bg-white p-6 shadow-panel space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink">Delete Study Notes?</h3>
              <p className="text-xs text-ink-secondary mt-1">
                Are you sure you want to delete <span className="font-semibold text-ink">"{deckToDelete.title}"</span>? This will permanently remove its {deckToDelete.cardCount} flashcards and scanned regions.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeckToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-paper-border bg-white px-4 py-2 text-xs font-semibold text-ink-secondary hover:bg-paper-warm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDeck}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                {isDeleting ? "Deleting…" : "Delete Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
