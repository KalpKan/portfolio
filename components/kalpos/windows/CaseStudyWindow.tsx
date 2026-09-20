"use client";

import dynamic from "next/dynamic";
import type { Tile } from "@/lib/tiles";

const CaseStudyBody = dynamic(() => import("./CaseStudyBody"), {
  loading: () => <div className="kos-case-loading">Opening…</div>,
});

/**
 * A case study inside a window. A deep link (/projects/<slug>) passes the
 * server-rendered body so the HTML carries the content for crawlers and
 * shared links; a tile opened from the desk loads it on demand.
 */
export default function CaseStudyWindow({ tile, body }: { tile: Tile; body?: React.ReactNode }) {
  return body ?? <CaseStudyBody tile={tile} />;
}
