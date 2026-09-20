import type { NowPlaying } from "@/lib/site";

/** Not mocked; the static track from lib/site.ts, or the honest empty state. */
export default function MusicWindow({ nowPlaying }: { nowPlaying: NowPlaying }) {
  if (!nowPlaying.title) {
    return (
      <div className="kos-body">
        <p className="kos-muted">Nothing playing right now.</p>
      </div>
    );
  }
  return (
    <div className="kos-body">
      <p className="kos-label">Now playing</p>
      <h2>{nowPlaying.title}</h2>
      <p className="kos-muted">{nowPlaying.artist}</p>
    </div>
  );
}
