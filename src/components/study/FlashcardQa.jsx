import FlashcardFlip from "./FlashcardFlip";

/**
 * QA card — simple question and answer.
 * @param {{ card: import("../../types").Flashcard, onFlipped?: (f: boolean) => void }} props
 */
export default function FlashcardQa({ card, onFlipped }) {
  return (
    <FlashcardFlip
      onFlipped={onFlipped}
      front={
        <p className="text-lg font-semibold text-slate-100 leading-snug">{card.front}</p>
      }
      back={
        <p className="text-base text-slate-200 leading-relaxed">{card.back}</p>
      }
    />
  );
}
