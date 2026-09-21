import type { Book } from "@/lib/site";

/**
 * Not mocked; the Reading window (2026-09-21, "make a section for what I am
 * reading currently"): the real jacket at 180 px with the page-edge shadow the
 * widget uses, the title, the authors, one honest line, and a link out to the
 * book's Open Library page. Covers are the publishers' art, committed under
 * public/images/reading/ and shown for identification only.
 */
export default function ReadingWindow({ reading = [] }: { reading?: readonly Book[] }) {
  const book = reading[0];
  if (!book) {
    return (
      <div className="kos-body">
        <p className="kos-muted">Nothing on the nightstand.</p>
      </div>
    );
  }
  return (
    <div className="kos-body kos-reading-win">
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 180 px jacket, no optimisation needed */}
      <img className="kos-book" src={book.cover} alt={`${book.title} book cover`} width={400} height={600} />
      <div>
        <p className="kos-label">Currently reading</p>
        <h2>{book.title}</h2>
        <p className="kos-muted">{book.authors}</p>
        <p>
          <a href={book.url} target="_blank" rel="noreferrer">
            Look it up ↗
          </a>
        </p>
      </div>
    </div>
  );
}
