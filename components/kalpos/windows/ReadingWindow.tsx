import type { Book } from "@/lib/site";

/**
 * Not mocked; the Reading window (2026-09-21, "make a section for what I am
 * reading currently"): the real jacket at 180 px with the page-edge shadow the
 * widget uses, the title, the authors, one honest line, and a link out to the
 * book's Open Library page. Under it, "Recently read" (2026-11-12): the books
 * Kalp has finished as a row of smaller linked covers in the order he read
 * them, hidden while the list is empty. Covers are the publishers' art,
 * committed under public/images/reading/ and shown for identification only.
 */
export default function ReadingWindow({ reading = [], recentlyRead = [] }: { reading?: readonly Book[]; recentlyRead?: readonly Book[] }) {
  const book = reading[0];
  if (!book && !recentlyRead.length) {
    return (
      <div className="kos-body">
        <p className="kos-muted">Nothing on the nightstand.</p>
      </div>
    );
  }
  return (
    <div className="kos-body">
      {book ? (
        <div className="kos-reading-win">
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
      ) : null}
      {recentlyRead.length ? (
        <section className="kos-shelf" aria-label="Recently read">
          <p className="kos-label">Recently read</p>
          <ul>
            {recentlyRead.map((b) => (
              <li key={b.url}>
                <a href={b.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 96 px jacket, no optimisation needed */}
                  <img className="kos-book" src={b.cover} alt={`${b.title} book cover`} width={400} height={600} />
                  <span className="kos-shelf-title">{b.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
