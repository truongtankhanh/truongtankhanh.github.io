// The public site keeps the owner's phone number private. These patterns cover Vietnamese numbers written the
// usual ways, so a test can scan any text that leaves this repository (content, JSON-LD, built HTML, PDF text).
const INTERNATIONAL = /(?:\+|\b00)\s*84/;
const NATIONAL = /\b0(?:[\s.-]?\d){9}\b/;

/** The first phone-number-like text in `text`, or `undefined`. Matches `0901234567`, `090 123 4567`, `+84 90 123 4567` and the like. */
export function findPhoneNumber(text: string): string | undefined {
  return INTERNATIONAL.exec(text)?.[0] ?? NATIONAL.exec(text)?.[0];
}
