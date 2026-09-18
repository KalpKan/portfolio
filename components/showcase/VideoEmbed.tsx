import type { Video } from "@/content/case-study";
import { isPlaceholder } from "@/content/case-study";
import { ASPECT_CLASS, PlaceholderBlock } from "./Media";

/**
 * The one video per case study. Videos are never committed to the repo
 * (docs/hosting-plan.md §6): an unlisted YouTube id renders a lazy iframe,
 * a hosted file URL (Cloudflare R2) renders a native player, and until Kalp
 * supplies either, a labelled placeholder holds the space.
 */
export function VideoEmbed({ video }: { video: Video }) {
  if (isPlaceholder(video)) {
    const portrait = video.aspect === "9/16" || video.aspect === "9/19.5";
    return (
      <PlaceholderBlock
        placeholder={video}
        className={portrait ? "max-w-[20rem]" : ""}
      />
    );
  }
  if (video.kind === "youtube") {
    return (
      <div className={`relative w-full bg-pad ${ASPECT_CLASS["16/9"]}`}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${video.id}`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  return (
    <video
      className="w-full bg-pad"
      controls
      preload="metadata"
      playsInline
      poster={typeof video.poster?.src === "string" ? video.poster.src : video.poster?.src.src}
      title={video.title}
    >
      <source src={video.url} />
    </video>
  );
}
