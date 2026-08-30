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
        <p className="text-lg font-semibold text-ink leading-snug">{card.front}</p>
      }
      back={
        <p className="text-base text-ink-secondary leading-relaxed">{card.back}</p>
      }
    />
  );
}
