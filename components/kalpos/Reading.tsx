"use client";

import type { Book } from "@/lib/site";
import type { Rect } from "@/lib/windows";
import { rectOf } from "./DeskIcons";

/**
 * The READING widget, under NOW PLAYING in card 2c's widget column: the same
 * frosted card, the small-caps label, the real jacket as a 44 × 66 thumbnail
 * with a page-edge shadow on its fore-edge, the title at 600 and the authors
 * at .6. It is a button: clicking it opens the Reading window from its own
 * rect, the way NOW PLAYING opens Music. Hidden by the parent while
 * SITE.reading is empty.
 */
export default function Reading({ reading, onOpen, index: gridIndex = 9 }: { reading: readonly Book[]; onOpen?: (origin?: Rect) => void; index?: number }) {
  const book = reading[0];
  if (!book) return null;
  return (
    <button
      type="button"
      className="kos-reading"
      style={{ ["--i" as string]: gridIndex }}
      aria-label={`Currently reading: ${book.title} by ${book.authors}. Open Reading`}
      onClick={(e) => onOpen?.(rectOf(e.currentTarget))}
    >
      <span className="kos-label">Reading</span>
      <span className="row">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 44 px thumbnail, no optimisation needed */}
        <img className="kos-book kos-book--thumb" src={book.cover} alt="" width={400} height={600} />
        <span className="meta">
          <span className="title">{book.title}</span>
          <span className="authors">{book.authors}</span>
        </span>
      </span>
    </button>
  );
}
