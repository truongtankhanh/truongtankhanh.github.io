import type { Resume } from '../content/types';

/** The accessible name of a download link: what it is, its type and, once the build knows it, its size. */
export function downloadLabel(cv: Resume['cv'], name: string): string {
  if (cv.bytes === null) return `${name}, PDF`;
  return `${name}, PDF, ${Math.max(1, Math.round(cv.bytes / 1024))} KB`;
}
