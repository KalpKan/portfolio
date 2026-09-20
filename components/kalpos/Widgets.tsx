import type { SiteConfig } from "@/lib/site";

/**
 * Card 2c's widgets: the yellow NOTE (SITE.note), the photo frame (SITE.photo
 * or the striped "photo of Kalp" placeholder) and the frosted NOW PLAYING
 * card, which hides while SITE.nowPlaying has no title.
 */
export default function Widgets({ site }: { site: SiteConfig }) {
  const playing = !!site.nowPlaying.title;
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
      {playing ? (
        <div className="kos-now" style={{ ["--i" as string]: 8 }}>
          <header>
            <span className="kos-label">Now playing</span>
            <i aria-hidden />
          </header>
          <div>
            <p className="title">{site.nowPlaying.title}</p>
            <p className="artist">{site.nowPlaying.artist}</p>
          </div>
          <div className="bar" aria-hidden>
            <i />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
