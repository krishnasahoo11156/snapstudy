import FlashcardFlip from "./FlashcardFlip";

/**
 * Labeled Diagram card — lists diagram parts and their descriptions.
 * @param {{ card: import("../../types").Flashcard, onFlipped?: (f: boolean) => void }} props
 */
export default function FlashcardDiagram({ card, onFlipped }) {
  return (
    <FlashcardFlip
      onFlipped={onFlipped}
      front={
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-100 leading-snug">{card.front}</p>
        </div>
      }
      back={
        <div className="w-full text-left">
          {card.labels && card.labels.length > 0 ? (
            <ul className="space-y-2.5">
              {card.labels.map((label, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="mt-0.5 shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-emerald-400 font-semibold whitespace-nowrap">
                    {label.part}
                  </span>
                  <span className="text-slate-300">{label.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-200">{card.back}</p>
          )}
        </div>
      }
    />
  );
}
