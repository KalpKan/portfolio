import { playlistOf, type SiteConfig } from "@/lib/site";
import type { Rect } from "@/lib/windows";
import NowPlaying from "./NowPlaying";

/**
 * Card 2c's widgets: the yellow NOTE (SITE.note), the photo frame (SITE.photo
 * or the striped "photo of Kalp" placeholder) and the frosted NOW PLAYING
 * card (NowPlaying.tsx), which hides while SITE.playlist is empty.
 */
export default function Widgets({ site, onOpenMusic }: { site: SiteConfig; onOpenMusic?: (origin?: Rect) => void }) {
  const playlist = playlistOf(site);
  return (
    <aside className="kos-widgets" aria-label="Widgets">
      <div className="kos-note" style={{ ["--i" as string]: 6 }}>
        <p className="kos-label">Note</p>
        <p>{site.note}</p>
      </div>
      <div className="kos-photo" style={{ ["--i" as string]: 7 }}>
        <div>
          {site.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- a fixed 130 px frame, no need for next/image
            <img src={site.photo} alt={`Photo of ${site.name}`} />
          ) : (
            <span>photo of {site.name.split(" ")[0]}</span>
          )}
        </div>
      </div>
      {playlist.length ? <NowPlaying playlist={playlist} onOpen={onOpenMusic} index={8} /> : null}
    </aside>
  );
}
