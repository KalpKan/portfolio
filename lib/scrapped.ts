/**
 * What is in the Trash: the archived repos Kalp scrapped. Rendered by the
 * Trash window (2e: "opening it shows scrapped ideas") and listed as files
 * under /trash in the terminal's virtual filesystem (lib/vfs.ts). The desk's
 * trash icon draws "full" while this list is non-empty.
 */
export type Scrapped = { name: string; line: string; href: string };

export const SCRAPPED: readonly Scrapped[] = [
  {
    name: "token-gamble-coinflip",
    line: "A coin-flip game that wagered API tokens. Fun for an afternoon, not a product.",
    href: "https://github.com/KalpKan/token-gamble-coinflip",
  },
  {
    name: "token-coinflip",
    line: "The first cut of the same idea, before the gamble mechanic.",
    href: "https://github.com/KalpKan/token-coinflip",
  },
];
