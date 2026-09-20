import { contactLinks } from "@/lib/contact";
import type { Contact } from "@/lib/site";

const FIELD: Record<string, string> = { email: "To", github: "GitHub", linkedin: "LinkedIn" };

/** Not mocked; mail-style: one header row per contact that is set, nothing for empties. */
export default function ContactWindow({ contact, name }: { contact: Contact; name: string }) {
  const links = contactLinks(contact);
  return (
    <div className="kos-body">
      {links.length === 0 ? (
        <p className="kos-muted">No contact details filed yet.</p>
      ) : (
        <>
          <dl className="kos-mail-head">
            {links.map((l) => (
              <div key={l.href} style={{ display: "contents" }}>
                <dt>{FIELD[l.kind]}</dt>
                <dd>
                  <a href={l.href} target={l.kind === "email" ? undefined : "_blank"} rel={l.kind === "email" ? undefined : "noreferrer"}>
                    {l.label}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <p>Hi {name.split(" ")[0]} — </p>
          <p className="kos-muted">Say hello about neurotech, a project on this desk, or anything you think should be on it.</p>
        </>
      )}
    </div>
  );
}
