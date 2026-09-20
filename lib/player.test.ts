import { describe, it, expect } from "vitest";
import { coverFor, ended, formatMs, hashString, initialPlayer, initialsOf, playerReducer, positionMs, TRACK_MS } from "./player";
import { PLAYLIST, SITE, playlistOf } from "./site";

describe("site playlist", () => {
  it("has the three songs, in order, with the unreleased tag on the third", () => {
    expect(PLAYLIST.map((t) => t.title)).toEqual(["Suffer", "These Words", "Choosin' Texas"]);
    expect(PLAYLIST[2].tag).toBe("unreleased");
    expect(PLAYLIST[0].tag).toBeUndefined();
  });

  it("nowPlaying is a getter on the first song", () => {
    expect(SITE.nowPlaying).toEqual(PLAYLIST[0]);
    expect(SITE.musicTitle).toBe("On repeat");
  });

  it("playlistOf falls back to nowPlaying for fixtures without a playlist, and to nothing", () => {
    expect(playlistOf(SITE)).toBe(PLAYLIST);
    expect(playlistOf({ nowPlaying: { title: "Bloom", artist: "Radiohead" } })).toEqual([{ title: "Bloom", artist: "Radiohead" }]);
    expect(playlistOf({ nowPlaying: { title: "", artist: "" } })).toEqual([]);
    expect(playlistOf({ nowPlaying: { title: "Bloom", artist: "Radiohead" }, playlist: [] })).toEqual([]);
  });
});

describe("player reducer", () => {
  const count = 3;
  const s0 = initialPlayer(1000);

  it("starts on the first song, playing from zero", () => {
    expect(s0).toEqual({ index: 0, paused: false, offset: 0, since: 1000 });
    expect(positionMs(s0, 1000)).toBe(0);
    expect(positionMs(s0, 6000)).toBe(5000);
  });

  it("next and prev wrap around the playlist and restart the position", () => {
    const s1 = playerReducer(s0, { type: "next", now: 5000 }, count);
    expect(s1.index).toBe(1);
    expect(positionMs(s1, 5000)).toBe(0);
    const s2 = playerReducer(s1, { type: "next", now: 5000 }, count);
    const s3 = playerReducer(s2, { type: "next", now: 5000 }, count);
    expect([s2.index, s3.index]).toEqual([2, 0]);
    const back = playerReducer(s0, { type: "prev", now: 5000 }, count);
    expect(back.index).toBe(2);
  });

  it("pause freezes the position, play resumes from it, toggle flips", () => {
    const p = playerReducer(s0, { type: "pause", now: 4000 }, count);
    expect(p.paused).toBe(true);
    expect(positionMs(p, 9000)).toBe(3000);
    expect(playerReducer(p, { type: "pause", now: 9000 }, count)).toBe(p);
    const r = playerReducer(p, { type: "play", now: 9000 }, count);
    expect(r.paused).toBe(false);
    expect(positionMs(r, 10000)).toBe(4000);
    expect(playerReducer(r, { type: "toggle", now: 10000 }, count).paused).toBe(true);
  });

  it("skipping keeps the paused state; selecting a row always plays", () => {
    const p = playerReducer(s0, { type: "pause", now: 4000 }, count);
    expect(playerReducer(p, { type: "next", now: 4000 }, count).paused).toBe(true);
    const sel = playerReducer(p, { type: "select", index: 2, now: 4000 }, count);
    expect(sel).toMatchObject({ index: 2, paused: false, offset: 0, since: 4000 });
    expect(playerReducer(s0, { type: "select", index: 9, now: 0 }, count).index).toBe(2);
    expect(playerReducer(s0, { type: "select", index: -1, now: 0 }, count).index).toBe(0);
  });

  it("the fake loop is 3:20 and ends only while playing", () => {
    expect(TRACK_MS).toBe(200_000);
    expect(formatMs(TRACK_MS)).toBe("3:20");
    expect(formatMs(61_500)).toBe("1:01");
    expect(ended(s0, 1000 + TRACK_MS - 1)).toBe(false);
    expect(ended(s0, 1000 + TRACK_MS)).toBe(true);
    expect(positionMs(s0, 1000 + TRACK_MS + 5000)).toBe(TRACK_MS);
    const p = playerReducer(s0, { type: "pause", now: 1000 + TRACK_MS }, count);
    expect(ended(p, 1000 + TRACK_MS + 5000)).toBe(false);
  });

  it("does nothing on an empty playlist", () => {
    expect(playerReducer(s0, { type: "next", now: 5000 }, 0)).toBe(s0);
  });
});

describe("cover art", () => {
  it("hashes deterministically", () => {
    expect(hashString("Suffer — Bex")).toBe(hashString("Suffer — Bex"));
    expect(hashString("Suffer — Bex")).not.toBe(hashString("Suffer — Bez"));
    expect(hashString("")).toBe(0x811c9dc5);
  });

  it("is the same gradient for the same song every time and differs per song", () => {
    const a = coverFor("Suffer", "Bex");
    const b = coverFor("Suffer", "Bex");
    const c = coverFor("These Words", "Badger & Natasha Bedingfield");
    expect(a).toEqual(b);
    expect(a.background).not.toBe(c.background);
    expect(a.background).toMatch(/^linear-gradient\(\d+deg, hsl\(\d+ 70% \d+%\) 0%, hsl\(\d+ 72% \d+%\) 100%\)$/);
  });

  it("draws the initials of the first two words, skipping leading punctuation", () => {
    expect(initialsOf("Suffer")).toBe("S");
    expect(initialsOf("These Words")).toBe("TW");
    expect(initialsOf("Choosin' Texas")).toBe("CT");
    expect(initialsOf("'til dawn (live)")).toBe("TD");
    expect(coverFor("Choosin' Texas", "Drake & Don Toliver").initials).toBe("CT");
  });
});
