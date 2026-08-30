import { useState } from "react";

/**
 * FlashcardFlip — 3D flip wrapper.
 * Click/tap to reveal the back face.
 *
 * @param {{ front: React.ReactNode, back: React.ReactNode, onFlipped?: (flipped: boolean) => void }} props
 */
export default function FlashcardFlip({ front, back, onFlipped }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    onFlipped?.(next);
  };

  return (
    <div
      id="flashcard-flip"
      className="perspective-1000 relative h-72 w-full cursor-pointer select-none"
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" || e.key === " " ? handleFlip() : null}
      aria-label={flipped ? "Showing answer — click to see question" : "Showing question — click to reveal answer"}
    >
      <div className={`transform-style-3d relative h-full w-full transition-transform duration-500 ${flipped ? "rotate-y-180" : ""}`}>
        {/* Front */}
        <div className="backface-hidden absolute inset-0 flex flex-col rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/60 p-6 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Question</span>
            <span className="text-xs text-slate-600">Tap to flip</span>
          </div>
          <div className="flex flex-1 items-center justify-center text-center">
            {front}
          </div>
        </div>

        {/* Back */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-2xl bg-gradient-to-br from-blue-950 to-violet-950 border border-blue-700/40 p-6 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400/70">Answer</span>
            <span className="text-xs text-slate-600">Tap to flip back</span>
          </div>
          <div className="flex flex-1 items-center justify-center text-center overflow-y-auto">
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}
