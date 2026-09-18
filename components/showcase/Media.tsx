import Image from "next/image";
import type { Aspect, MediaItem, Placeholder } from "@/content/case-study";

/**
 * Media blocks for case-study pages.
 *
 * A Figure is a real image through next/image (WebP from public/images/
 * projects, or a hosted URL) inside an aspect box, so the layout never jumps
 * when the file loads. A PlaceholderBlock is drawn at the same size with a
 * dashed hairline (the "coming" mark from the site map, not a colour) and a
 * mono label, so a visitor sees an honest gap and Kalp sees exactly what to
 * supply.
 */

export const ASPECT_CLASS: Record<Aspect, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "9/19.5": "aspect-[9/19.5]",
  "1/1": "aspect-square",
  "9/16": "aspect-[9/16]",
};

export function Figure({
  item,
  aspect,
  sizes,
  priority = false,
  className = "",
}: {
  item: MediaItem;
  aspect: Aspect;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className={`relative w-full overflow-hidden bg-pad ${ASPECT_CLASS[aspect]}`}>
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
      {item.caption && (
        <figcaption className="mt-2 text-[12px] leading-relaxed text-ink-3">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function PlaceholderBlock({
  placeholder,
  aspect = placeholder.aspect,
  className = "",
}: {
  placeholder: Placeholder;
  aspect?: Aspect;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={placeholder.label}
      data-placeholder
      className={`flex w-full items-end border border-dashed border-rule bg-pad p-3 ${ASPECT_CLASS[aspect]} ${className}`}
    >
      <p className="max-w-[28ch] font-mono text-[12px] leading-snug text-ink-2">
        {placeholder.label}
      </p>
    </div>
  );
}
