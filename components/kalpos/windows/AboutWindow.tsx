import { contactLinks } from "@/lib/contact";
import type { SiteConfig } from "@/lib/site";

/** Not mocked; the About me document in the desk idiom: name, identity line, the note, contacts, résumé. */
export default function AboutWindow({ site }: { site: SiteConfig }) {
  const links = contactLinks(site.contact);
  return (
    <div className="kos-body">
      <h2>{site.name}</h2>
      <p className="kos-muted">{site.tagline}</p>
      <p>{site.note}</p>
      {site.resumeUrl ? (
        <p>
          <a href={site.resumeUrl} target="_blank" rel="noreferrer">
            Résumé ↓
          </a>
        </p>
      ) : null}
      {links.length ? (
        <p>
          {links.map((l, i) => (
            <span key={l.href}>
              {i ? " · " : ""}
              <a href={l.href} target={l.kind === "email" ? undefined : "_blank"} rel={l.kind === "email" ? undefined : "noreferrer"}>
                {l.label}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
