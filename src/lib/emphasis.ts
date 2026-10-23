export interface EmphasisPart {
  text: string;
  strong: boolean;
}

const MARK = '**';

/**
 * Splits a bullet into plain and strong parts. The key phrase is wrapped in `**double asterisks**` in the
 * content file; a component renders the strong parts as `<strong>`. Throws on an unbalanced or empty marker, so a
 * typo in the content fails the build instead of showing stray asterisks.
 */
export function emphasis(text: string): EmphasisPart[] {
  const pieces = text.split(MARK);
  if (pieces.length % 2 === 0) throw new Error(`Unbalanced ${MARK} in: ${text}`);
  const parts: EmphasisPart[] = [];
  pieces.forEach((piece, i) => {
    const strong = i % 2 === 1;
    if (strong && piece.trim() === '') throw new Error(`Empty ${MARK}${MARK} in: ${text}`);
    if (piece !== '') parts.push({ text: piece, strong });
  });
  return parts;
}

/** The text without its markers, for places that show plain text. */
export function stripEmphasis(text: string): string {
  return emphasis(text)
    .map((part) => part.text)
    .join('');
}
