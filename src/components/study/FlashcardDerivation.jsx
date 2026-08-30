import FlashcardFlip from "./FlashcardFlip";

/**
 * Derivation Steps card — shows ordered steps on the back.
 * @param {{ card: import("../../types").Flashcard, onFlipped?: (f: boolean) => void }} props
 */
export default function FlashcardDerivation({ card, onFlipped }) {
  return (
    <FlashcardFlip
      onFlipped={onFlipped}
      front={
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-100 leading-snug">{card.front}</p>
        </div>
      }
      back={
        <div className="w-full text-left">
          <p className="mb-3 text-sm text-blue-300 font-medium">{card.back}</p>
          {card.steps && card.steps.length > 0 && (
            <ol className="space-y-2">
              {card.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      }
    />
  );
}
