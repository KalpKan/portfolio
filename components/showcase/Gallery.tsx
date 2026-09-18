import type { Gallery as GalleryT } from "@/content/case-study";
import { isPlaceholder } from "@/content/case-study";
import { Figure, PlaceholderBlock } from "./Media";

/** Photo gallery: a hairline grid of figures, or N placeholder blocks. */
export function Gallery({ gallery }: { gallery: GalleryT }) {
  if (isPlaceholder(gallery)) {
    const n = gallery.count ?? 1;
    return (
      <div className={`grid gap-4 ${n > 1 ? "sm:grid-cols-2" : ""}`}>
        {Array.from({ length: n }, (_, i) => (
          <PlaceholderBlock key={i} placeholder={gallery} />
        ))}
      </div>
    );
  }
  const aspect = gallery.aspect ?? "4/3";
  const portrait = aspect === "9/16" || aspect === "9/19.5";
  return (
    <div
      className={
        portrait
          ? "grid grid-cols-2 gap-4 md:grid-cols-4"
          : "grid gap-4 sm:grid-cols-2"
      }
    >
      {gallery.items.map((item) => (
        <Figure
          key={item.alt}
          item={item}
          aspect={aspect}
          sizes={portrait ? "(min-width: 768px) 18rem, 45vw" : "(min-width: 640px) 36rem, 100vw"}
        />
      ))}
    </div>
  );
}
