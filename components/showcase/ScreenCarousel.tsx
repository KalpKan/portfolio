import type { Gallery as GalleryT } from "@/content/case-study";
import { isPlaceholder } from "@/content/case-study";
import { Figure, PlaceholderBlock } from "./Media";

/**
 * App screens as a horizontal, scroll-snapping strip of phone-shaped
 * figures. No buttons (the design system has none): the strip scrolls with
 * a swipe, a trackpad, or the thin scrollbar, and every item is reachable by
 * keyboard because the list itself is focusable.
 */
export function ScreenCarousel({ screens }: { screens: GalleryT }) {
  const items = isPlaceholder(screens)
    ? Array.from({ length: screens.count ?? 3 }, (_, i) => ({ key: String(i), node: <PlaceholderBlock placeholder={screens} /> }))
    : screens.items.map((item) => ({
        key: item.alt,
        node: <Figure item={item} aspect={screens.aspect ?? "9/19.5"} sizes="14rem" />,
      }));
  const phone = isPlaceholder(screens) ? screens.aspect !== "4/3" : (screens.aspect ?? "9/19.5") !== "4/3";

  return (
    <ul
      tabIndex={0}
      aria-label="App screens"
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:-mx-0 md:px-0"
    >
      {items.map(({ key, node }) => (
        <li
          key={key}
          className={`shrink-0 snap-start ${phone ? "w-[13rem] md:w-[14rem]" : "w-[20rem] md:w-[24rem]"}`}
        >
          {node}
        </li>
      ))}
    </ul>
  );
}
