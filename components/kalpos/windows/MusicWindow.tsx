"use client";

import { Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import { useRef } from "react";
import { coverFor, formatMs, TRACK_MS } from "@/lib/player";
import type { Track } from "@/lib/site";
import { track as capture } from "@/lib/track";
import { usePlayer } from "../usePlayer";

/**
 * Only a real Spotify track link is ever opened: protects against a mistyped
 * or malicious `spotifyUrl` reaching `window.open`. `https://` only, host
 * `open.spotify.com`, path starting `/track/`.
 */
export function isSpotifyTrackUrl(url: string | undefined): url is string {
  if (!url) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return u.protocol === "https:" && u.hostname === "open.spotify.com" && u.pathname.startsWith("/track/");
}

/**
 * The Music app: a generated square cover on the left (a two-tone gradient
 * hashed from title + artist plus the song's initials; nothing fetched, no
 * copyrighted art), the transport under it, and the track list on the right
 * (index, title, artist, an "unreleased" pill where set, a "—" duration that
 * becomes a small "open ↗" hint on hover/focus when the song has a Spotify
 * link). The current row is tinted. No audio plays: the progress line walks
 * a fake 3:20 loop that the widget shares (usePlayer), and the footer says so.
 *
 * Keyboard inside the window: ↑/↓ move between rows, Enter plays the focused
 * row (or, when that row is already the current track, opens it on Spotify),
 * Space pauses or resumes. Double-clicking a row opens it on Spotify the same
 * way; a single click always keeps its select/play behaviour.
 */
export default function MusicWindow({ playlist, title = "On repeat" }: { playlist: readonly Track[]; title?: string }) {
  const { state, position, dispatch } = usePlayer(playlist.length);
  const list = useRef<HTMLOListElement>(null);

  if (playlist.length === 0) {
    return (
      <div className="kos-body">
        <p className="kos-muted">Nothing playing right now.</p>
      </div>
    );
  }

  const index = Math.min(state.index, playlist.length - 1);
  const current = playlist[index]!;
  const cover = coverFor(current.title, current.artist);
  const progress = Math.min(1, position / TRACK_MS);

  const select = (i: number) => {
    dispatch({ type: "select", index: i });
    capture("music_track_selected", { index: i });
  };
  const skip = (type: "next" | "prev") => {
    dispatch({ type });
    capture("music_track_selected", { index: type === "next" ? (index + 1) % playlist.length : (index - 1 + playlist.length) % playlist.length });
  };
  /** The row's double-click / Enter-on-current shortcut: a new tab, guarded. */
  const openSpotify = (i: number) => {
    const url = playlist[i]?.spotifyUrl;
    if (!isSpotifyTrackUrl(url)) return;
    window.open(url, "_blank", "noopener,noreferrer");
    capture("music_opened_spotify", { index: i });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      dispatch({ type: "toggle" });
      return;
    }
    if (e.key === "Enter") {
      const rows = [...(list.current?.querySelectorAll<HTMLButtonElement>("button.kos-track") ?? [])];
      const at = rows.findIndex((r) => r === document.activeElement);
      if (at === -1) return;
      e.preventDefault();
      if (at === index) openSpotify(at);
      else select(at);
      return;
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const rows = [...(list.current?.querySelectorAll<HTMLButtonElement>("button.kos-track") ?? [])];
    if (!rows.length) return;
    const at = rows.findIndex((r) => r === document.activeElement);
    const from = at === -1 ? index : at;
    const to = e.key === "ArrowDown" ? (from + 1) % rows.length : (from - 1 + rows.length) % rows.length;
    rows[to]!.focus();
  };

  return (
    <div className="kos-body kos-music" onKeyDown={onKeyDown}>
      <div className="kos-music-side">
        {current.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- static square art, no optimisation needed
          <img className="kos-cover kos-cover--art" src={current.cover} alt={`Cover art for ${current.title} by ${current.artist}`} width={180} height={180} loading="lazy" decoding="async" />
        ) : (
          <div className="kos-cover" style={{ background: cover.background }} role="img" aria-label={`Cover for ${current.title}: generated art`}>
            <span aria-hidden>{cover.initials}</span>
          </div>
        )}
        <div className="kos-music-progress" aria-hidden>
          <div className="bar">
            <i style={{ width: `${(progress * 100).toFixed(2)}%` }} />
          </div>
          <div className="times">
            <span>{formatMs(position)}</span>
            <span>{formatMs(TRACK_MS)}</span>
          </div>
        </div>
        <div className="kos-transport" role="group" aria-label="Transport">
          <button type="button" aria-label="Previous song" onClick={() => skip("prev")}>
            <SkipBack weight="fill" />
          </button>
          <button type="button" className="play" aria-label={state.paused ? "Play" : "Pause"} aria-pressed={!state.paused} onClick={() => dispatch({ type: "toggle" })}>
            {state.paused ? <Play weight="fill" /> : <Pause weight="fill" />}
          </button>
          <button type="button" aria-label="Next song" onClick={() => skip("next")}>
            <SkipForward weight="fill" />
          </button>
        </div>
      </div>

      <div className="kos-music-main">
        <p className="kos-label">{title}</p>
        <ol ref={list} className="kos-tracks" aria-label="Songs">
          {playlist.map((t, i) => (
            <li key={`${t.title}|${t.artist}`}>
              <button
                type="button"
                className="kos-track"
                aria-current={i === index ? "true" : undefined}
                onClick={() => select(i)}
                onDoubleClick={() => openSpotify(i)}
                title={isSpotifyTrackUrl(t.spotifyUrl) ? `Double-click to open "${t.title}" on Spotify` : undefined}
              >
                <span className="n">{i === index && !state.paused ? "♪" : i + 1}</span>
                <span className="who">
                  <span className="t">{t.title}</span>
                  <span className="a">{t.artist}</span>
                </span>
                {t.tag ? <span className="kos-tag">{t.tag}</span> : null}
                <span className="d-wrap">
                  <span className="d">—</span>
                  {isSpotifyTrackUrl(t.spotifyUrl) ? (
                    <span className="kos-open-hint" aria-hidden>
                      open ↗
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="kos-music-foot">Visual only · no audio plays</p>
      </div>
    </div>
  );
}
