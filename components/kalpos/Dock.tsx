"use client";

import { EnvelopeSimple, FilePdf, Folders, Image as ImageIcon, MusicNotes, Note, TerminalWindow } from "@phosphor-icons/react";
import { useState } from "react";
import type { WindowId, WindowsState } from "@/lib/windows";
import { isOpen } from "@/lib/windows";
import type { Rect } from "@/lib/windows";
import { rectOf, TrashGlyph } from "./DeskIcons";

type DockTile = { key: string; label: string; window?: WindowId; href?: string; icon: React.ReactNode };

/**
 * Card 2c's dock: Finder (Projects), Notes (About me), Mail (Contact), Music
 * (hidden while the playlist is empty), Photos (Hobbies), Terminal (the
 * health log), PDF (Résumé, hidden while empty), a separator, Trash (the desk's own drawing, small;
 * DeskIcons.tsx). A running dot marks an open
 * window; hover magnifies 1.18 with neighbours 1.08 and the label above
 * (2e, CSS); launching bounces once.
 */
export default function Dock({
  windows,
  onOpen,
  resumeUrl,
  hasMusic = true,
}: {
  windows: WindowsState;
  onOpen: (id: WindowId, origin?: Rect) => void;
  resumeUrl: string;
  /** False hides the Music tile (SITE.playlist empty). */
  hasMusic?: boolean;
}) {
  const [bouncing, setBouncing] = useState<string | null>(null);
  const tiles: DockTile[] = [
    { key: "finder", label: "Projects", window: "projects", icon: <Folders weight="duotone" /> },
    { key: "notes", label: "About me", window: "about", icon: <Note weight="duotone" /> },
    { key: "mail", label: "Contact", window: "contact", icon: <EnvelopeSimple weight="duotone" /> },
    ...(hasMusic ? [{ key: "music", label: "Music", window: "music" as WindowId, icon: <MusicNotes weight="duotone" /> }] : []),
    { key: "photos", label: "Hobbies", window: "hobbies", icon: <ImageIcon weight="duotone" /> },
    { key: "terminal", label: "Terminal", window: "terminal", icon: <TerminalWindow weight="duotone" /> },
    ...(resumeUrl ? [{ key: "pdf", label: "Résumé", href: resumeUrl, icon: <FilePdf weight="duotone" /> }] : []),
  ];
  const trash: DockTile = { key: "trash", label: "Trash", window: "trash", icon: <TrashGlyph size="dock" /> };

  const render = (t: DockTile) => {
    const cls = `kos-dock-item kos-dock-item--${t.key}`;
    const label = <span className="kos-dock-label">{t.label}</span>;
    if (t.href) {
      return (
        <a key={t.key} className={cls} href={t.href} target="_blank" rel="noreferrer" aria-label={t.label}>
          {t.icon}
          {label}
        </a>
      );
    }
    const open = t.window ? isOpen(windows, t.window) : false;
    return (
      <button
        key={t.key}
        type="button"
        className={cls}
        aria-label={t.label}
        data-bounce={bouncing === t.key ? "true" : undefined}
        onAnimationEnd={() => setBouncing((b) => (b === t.key ? null : b))}
        onClick={(e) => {
          if (!open) setBouncing(t.key);
          onOpen(t.window!, rectOf(e.currentTarget));
        }}
      >
        {t.icon}
        {open ? <i className="kos-dock-dot" aria-hidden /> : null}
        {label}
      </button>
    );
  };

  return (
    <nav className="kos-dock" aria-label="Dock">
      {tiles.map(render)}
      <i className="kos-dock-sep" aria-hidden />
      {render(trash)}
    </nav>
  );
}
