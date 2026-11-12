import { beforeAll, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { render } from "@/test/render";
import { FAVOURITES, READING, RECENTLY_READ, SITE } from "@/lib/site";
import Reading from "./Reading";
import ReadingWindow from "./windows/ReadingWindow";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const book = {
  title: "The Molecule of More",
  authors: "Daniel Z. Lieberman & Michael E. Long",
  cover: "/images/reading/molecule-of-more.jpg",
  url: "https://openlibrary.org/isbn/9781946885111",
};

const recent = [
  { title: "Red Rising", authors: "Pierce Brown", cover: "/images/reading/red-rising.jpg", url: "https://openlibrary.org/isbn/9780345539786" },
  { title: "Golden Son", authors: "Pierce Brown", cover: "/images/reading/golden-son.jpg", url: "https://openlibrary.org/isbn/9780345539816" },
  { title: "Morning Star", authors: "Pierce Brown", cover: "/images/reading/morning-star.jpg", url: "https://openlibrary.org/isbn/9780345539847" },
];

const favourites = [
  { title: "Surely You're Joking, Mr. Feynman!", authors: "Richard P. Feynman", cover: "/images/reading/surely-youre-joking-mr-feynman.jpg", url: "https://openlibrary.org/isbn/9780393316049" },
  { title: "A Series of Unfortunate Events", authors: "Lemony Snicket", note: "13 books", cover: "/images/reading/a-series-of-unfortunate-events.jpg", url: "https://openlibrary.org/isbn/9780060283124" },
  { title: "The Stranger", authors: "Albert Camus", cover: "/images/reading/the-stranger.jpg", url: "https://openlibrary.org/isbn/9780679720201" },
];

const root = path.resolve(__dirname, "..", "..");

describe("the READING widget", () => {
  it("shows the cover thumbnail, the title and the authors", () => {
    const { container, unmount } = render(<Reading reading={[book]} />);
    const card = container.querySelector("button.kos-reading")!;
    expect(card.querySelector(".kos-label")!.textContent).toBe("Reading");
    const img = card.querySelector("img.kos-book--thumb")!;
    expect(img.getAttribute("src")).toBe(book.cover);
    // The cover is decoration beside the title it already names.
    expect(img.getAttribute("alt")).toBe("");
    expect(card.querySelector(".title")!.textContent).toBe(book.title);
    expect(card.querySelector(".authors")!.textContent).toBe(book.authors);
    expect(card.getAttribute("aria-label")).toContain("Currently reading: The Molecule of More");
    unmount();
  });

  it("opens the Reading window from its own rect", () => {
    const onOpen = vi.fn();
    const { container, unmount } = render(<Reading reading={[book]} onOpen={onOpen} />);
    container.querySelector<HTMLButtonElement>("button.kos-reading")!.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("renders nothing while the reading list is empty", () => {
    const { container, unmount } = render(<Reading reading={[]} />);
    expect(container.querySelector(".kos-reading")).toBeNull();
    unmount();
  });
});

describe("the Reading window", () => {
  it("shows the 180 px cover with a real alt, the title, the authors and the link out", () => {
    const { container, unmount } = render(<ReadingWindow reading={[book]} />);
    const img = container.querySelector("img.kos-book")!;
    expect(img.getAttribute("alt")).toBe("The Molecule of More book cover");
    expect(container.querySelector(".kos-label")!.textContent).toBe("Currently reading");
    expect(container.querySelector("h2")!.textContent).toBe(book.title);
    expect(container.textContent).toContain(book.authors);
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe(book.url);
    expect(a.getAttribute("rel")).toBe("noreferrer");
    expect(a.getAttribute("target")).toBe("_blank");
    unmount();
  });

  it("is an honest empty state with no book", () => {
    const { container, unmount } = render(<ReadingWindow reading={[]} />);
    expect(container.textContent).toContain("Nothing on the nightstand");
    expect(container.querySelector("img")).toBeNull();
    unmount();
  });
});

describe("the Reading window's Recently read shelf", () => {
  it("shows each recent book as a linked cover with a real alt and its title, in order, under the current book", () => {
    const { container, unmount } = render(<ReadingWindow reading={[book]} recentlyRead={recent} />);
    const shelf = container.querySelector(".kos-shelf--recent")!;
    expect(shelf).not.toBeNull();
    expect(shelf.querySelector(".kos-label")!.textContent).toBe("Recently read");
    const items = [...shelf.querySelectorAll("li")];
    expect(items.map((li) => li.querySelector(".kos-shelf-title")!.textContent)).toEqual(["Red Rising", "Golden Son", "Morning Star"]);
    expect(items.map((li) => li.querySelector("img.kos-book")!.getAttribute("alt"))).toEqual([
      "Red Rising book cover",
      "Golden Son book cover",
      "Morning Star book cover",
    ]);
    const a = items[1].querySelector("a")!;
    expect(a.getAttribute("href")).toBe(recent[1].url);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noreferrer");
    // The current book is still first.
    expect(container.querySelector("h2")!.textContent).toBe(book.title);
    expect(container.querySelector(".kos-reading-win")!.compareDocumentPosition(shelf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    unmount();
  });

  it("hides the shelf while the recently-read list is empty", () => {
    const { container, unmount } = render(<ReadingWindow reading={[book]} recentlyRead={[]} />);
    expect(container.querySelector(".kos-shelf--recent")).toBeNull();
    expect(container.textContent).not.toContain("Recently read");
    unmount();
  });

  it("still shows the shelf when nothing is current", () => {
    const { container, unmount } = render(<ReadingWindow reading={[]} recentlyRead={recent} />);
    expect(container.querySelector(".kos-shelf--recent")).not.toBeNull();
    expect(container.textContent).not.toContain("Nothing on the nightstand");
    unmount();
  });
});

describe("the Reading window's Favourites shelf", () => {
  it("is its own shelf under Recently read: three linked covers, the series with its note", () => {
    const { container, unmount } = render(<ReadingWindow reading={[book]} recentlyRead={recent} favourites={favourites} />);
    const shelves = [...container.querySelectorAll(".kos-shelf")];
    expect(shelves.map((s) => s.querySelector(".kos-label")!.textContent)).toEqual(["Recently read", "Favourites"]);
    const fav = container.querySelector(".kos-shelf--favourites")!;
    const items = [...fav.querySelectorAll("li")];
    expect(items.map((li) => li.querySelector(".kos-shelf-title")!.textContent)).toEqual([
      "Surely You're Joking, Mr. Feynman!",
      "A Series of Unfortunate Events",
      "The Stranger",
    ]);
    expect(items[1].querySelector(".kos-shelf-note")!.textContent).toBe("13 books");
    expect(items[0].querySelector(".kos-shelf-note")).toBeNull();
    expect(items[1].querySelector("img.kos-book")!.getAttribute("alt")).toBe("A Series of Unfortunate Events book cover");
    const a = items[2].querySelector("a")!;
    expect(a.getAttribute("href")).toBe(favourites[2].url);
    expect(a.getAttribute("rel")).toBe("noreferrer");
    unmount();
  });

  it("hides the Favourites shelf while the list is empty, and keeps Recently read", () => {
    const { container, unmount } = render(<ReadingWindow reading={[book]} recentlyRead={recent} favourites={[]} />);
    expect(container.querySelector(".kos-shelf--favourites")).toBeNull();
    expect(container.textContent).not.toContain("Favourites");
    expect(container.querySelector(".kos-shelf--recent")).not.toBeNull();
    unmount();
  });

  it("shows only Favourites when it is the only list", () => {
    const { container, unmount } = render(<ReadingWindow favourites={favourites} />);
    expect(container.querySelector(".kos-shelf--favourites")).not.toBeNull();
    expect(container.textContent).not.toContain("Nothing on the nightstand");
    unmount();
  });
});

describe("the committed cover", () => {
  it("SITE.reading points at a committed JPEG of 120 KB or less", () => {
    expect(SITE.reading).toBe(READING);
    expect(SITE.recentlyRead).toBe(RECENTLY_READ);
    expect(SITE.favourites).toBe(FAVOURITES);
    for (const b of [...READING, ...RECENTLY_READ, ...FAVOURITES]) {
      expect(b.cover).toMatch(/^\/images\/reading\/.+\.jpg$/);
      const file = path.join(root, "public", b.cover);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeLessThanOrEqual(120 * 1024);
      // A real jacket, not Open Library's 1×1 "no cover" placeholder.
      expect(statSync(file).size).toBeGreaterThan(5 * 1024);
      const head = readFileSync(file).subarray(0, 3);
      expect([...head]).toEqual([0xff, 0xd8, 0xff]);
      expect(b.url.startsWith("https://")).toBe(true);
    }
  });
});

describe("the reading data (2026-11-12)", () => {
  it("is A Brief History of Time now, and The Molecule of More is off the desk", () => {
    expect(READING.map((b) => b.title)).toEqual(["A Brief History of Time"]);
    expect(READING[0].authors).toBe("Stephen Hawking");
    expect(READING[0].url).toBe("https://openlibrary.org/isbn/9780553380163");
  });

  it("recently read is the first three Red Rising books in series order", () => {
    expect(RECENTLY_READ.map((b) => b.title)).toEqual(["Red Rising", "Golden Son", "Morning Star"]);
    for (const b of RECENTLY_READ) expect(b.authors).toBe("Pierce Brown");
    expect(RECENTLY_READ.map((b) => b.url)).toEqual([
      "https://openlibrary.org/isbn/9780345539786",
      "https://openlibrary.org/isbn/9780345539816",
      "https://openlibrary.org/isbn/9780345539847",
    ]);
  });

  it("pins the list lengths: 1 current, 3 recent (the three most recent only), 3 favourites", () => {
    expect(READING).toHaveLength(1);
    expect(RECENTLY_READ).toHaveLength(3);
    expect(FAVOURITES).toHaveLength(3);
  });

  it("The Molecule of More is finished but not shown anywhere, and its jacket is gone", () => {
    const shown = [...READING, ...RECENTLY_READ, ...FAVOURITES].map((b) => b.title);
    expect(shown).not.toContain("The Molecule of More");
    expect(existsSync(path.join(root, "public/images/reading/molecule-of-more.jpg"))).toBe(false);
  });

  it("favourites are Feynman, the Series of Unfortunate Events (as a series, with a note) and The Stranger", () => {
    expect(FAVOURITES.map((b) => b.title)).toEqual(["Surely You're Joking, Mr. Feynman!", "A Series of Unfortunate Events", "The Stranger"]);
    expect(FAVOURITES.map((b) => b.authors)).toEqual(["Richard P. Feynman", "Lemony Snicket", "Albert Camus"]);
    expect(FAVOURITES[1].note).toBe("13 books");
    expect(FAVOURITES.map((b) => b.url)).toEqual([
      "https://openlibrary.org/isbn/9780393316049",
      "https://openlibrary.org/isbn/9780060283124",
      "https://openlibrary.org/isbn/9780679720201",
    ]);
  });

  it("every cover on the shelf is a distinct file", () => {
    const covers = [...READING, ...RECENTLY_READ, ...FAVOURITES].map((b) => b.cover);
    expect(new Set(covers).size).toBe(covers.length);
  });
});
