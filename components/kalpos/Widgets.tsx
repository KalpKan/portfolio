import { playlistOf, type SiteConfig } from "@/lib/site";
import type { Rect } from "@/lib/windows";
import NowPlaying from "./NowPlaying";
import Reading from "./Reading";

/**
 * Card 2c's widgets: the yellow NOTE (SITE.note), the photo frame (SITE.photo
 * or the striped "photo of Kalp" placeholder), the frosted NOW PLAYING card
 * (NowPlaying.tsx) and, under it, the frosted READING card (Reading.tsx).
 * Each of the two frosted cards hides while its list in lib/site.ts is empty.
 */
export default function Widgets({
  site,
  onOpenMusic,
  onOpenReading,
}: {
  site: SiteConfig;
  onOpenMusic?: (origin?: Rect) => void;
  onOpenReading?: (origin?: Rect) => void;
}) {
  const playlist = playlistOf(site);
  const reading = site.reading ?? [];
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
            <img src={site.photo} alt={site.name} width={640} height={640} />
          ) : (
            <span>photo of {site.name.split(" ")[0]}</span>
          )}
        </div>
      </div>
      {playlist.length ? <NowPlaying playlist={playlist} onOpen={onOpenMusic} index={8} /> : null}
      {reading.length ? <Reading reading={reading} onOpen={onOpenReading} index={9} /> : null}
    </aside>
  );
}
