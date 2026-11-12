import type { Book } from "@/lib/site";

/**
 * Not mocked; the Reading window (2026-09-21, "make a section for what I am
 * reading currently"): the real jacket at 180 px with the page-edge shadow the
 * widget uses, the title, the authors, one honest line, and a link out to the
 * book's Open Library page. Under it two shelves of smaller linked covers
 * (2026-11-12): "Recently read" (the three latest finished books, in order)
 * and "Favourites" (three slots). Each hides while its list is empty. Covers
 * are the publishers' art, committed under public/images/reading/ and shown
 * for identification only.
 */
export default function ReadingWindow({
  reading = [],
  recentlyRead = [],
  favourites = [],
}: {
  reading?: readonly Book[];
  recentlyRead?: readonly Book[];
  favourites?: readonly Book[];
}) {
  const book = reading[0];
  if (!book && !recentlyRead.length && !favourites.length) {
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
      <Shelf className="kos-shelf--recent" label="Recently read" books={recentlyRead} />
      <Shelf className="kos-shelf--favourites" label="Favourites" books={favourites} />
    </div>
  );
}

function Shelf({ className, label, books }: { className: string; label: string; books: readonly Book[] }) {
  if (!books.length) return null;
  return (
    <section className={`kos-shelf ${className}`} aria-label={label}>
      <p className="kos-label">{label}</p>
      <ul>
        {books.map((b) => (
          <li key={b.url}>
            <a href={b.url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 84 px jacket, no optimisation needed */}
              <img className="kos-book" src={b.cover} alt={`${b.title} book cover`} width={400} height={600} />
              <span className="kos-shelf-title">{b.title}</span>
              {b.note ? <span className="kos-shelf-note">{b.note}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
