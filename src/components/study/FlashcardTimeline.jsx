import FlashcardFlip from "./FlashcardFlip";

/**
 * Timeline card — ordered sequence of events or phases.
 * @param {{ card: import("../../types").Flashcard, onFlipped?: (f: boolean) => void }} props
 */
export default function FlashcardTimeline({ card, onFlipped }) {
  return (
    <FlashcardFlip
      onFlipped={onFlipped}
      front={
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 border border-orange-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-ink leading-snug">{card.front}</p>
        </div>
      }
      back={
        <div className="w-full text-left">
          {card.steps && card.steps.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-orange-300" />
              {card.steps.map((step, i) => (
                <div key={i} className="relative mb-3 flex items-start gap-3 text-xs last:mb-0">
                  <div className="absolute -left-4 mt-0.5 h-3 w-3 rounded-full border-2 border-orange-500 bg-white" />
                  <p className="text-ink-secondary">{step}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-secondary">{card.back}</p>
          )}
        </div>
      }
    />
  );
}
