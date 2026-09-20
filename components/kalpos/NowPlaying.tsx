"use client";

import { TRACK_MS } from "@/lib/player";
import type { Track } from "@/lib/site";
import type { Rect } from "@/lib/windows";
import { rectOf } from "./DeskIcons";
import { usePlayer } from "./usePlayer";

/**
 * Card 2c's NOW PLAYING widget: the 150 px frosted card with the small-caps
 * label, the pink dot (pulsing while playing), the song at 600 and the
 * artist at .6, and a thin progress line that walks the fake 3:20 loop.
 * It is a button: clicking it opens the Music window from its own rect.
 * Hidden by the parent while the playlist is empty.
 */
export default function NowPlaying({ playlist, onOpen, index: gridIndex = 8 }: { playlist: readonly Track[]; onOpen?: (origin?: Rect) => void; index?: number }) {
  const { state, position } = usePlayer(playlist.length);
  const track = playlist[Math.min(state.index, playlist.length - 1)];
  if (!track) return null;
  const progress = Math.min(1, position / TRACK_MS);
  return (
    <button
      type="button"
      className="kos-now"
      style={{ ["--i" as string]: gridIndex, ["--p" as string]: progress.toFixed(4) }}
      data-paused={state.paused ? "true" : undefined}
      aria-label={`Now playing: ${track.title} by ${track.artist}. Open Music`}
      onClick={(e) => onOpen?.(rectOf(e.currentTarget))}
    >
      <header>
        <span className="kos-label">Now playing</span>
        <i aria-hidden />
      </header>
      <div>
        <p className="title">{track.title}</p>
        <p className="artist">{track.artist}</p>
      </div>
      <div className="bar" aria-hidden>
        <i />
      </div>
    </button>
  );
}
