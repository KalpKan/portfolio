const SCRAPPED = [
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

/** Not mocked; "opening it shows scrapped ideas" (2e): the two archived coinflip repos. */
export default function TrashWindow() {
  return (
    <div className="kos-body">
      <h2>Scrapped ideas</h2>
      <p className="kos-muted">Two archived repos. Kept for the record, not on the desk.</p>
      <ul className="kos-rows">
        {SCRAPPED.map((s) => (
          <li key={s.href} className="kos-row">
            <i className="kos-row--icon" aria-hidden />
            <span style={{ minWidth: 0 }}>
              <b>
                <a href={s.href} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
              </b>
              <span className="kos-muted">{s.line}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
