import type { Contact } from "./site";

export type ContactLink = { kind: "email" | "github" | "linkedin"; label: string; href: string };

/**
 * The contact links the About and Contact windows show. Empty values produce
 * no link, so with every field empty the caller renders nothing.
 */
export function contactLinks(contact: Contact): ContactLink[] {
  const links: ContactLink[] = [];
  if (contact.email) links.push({ kind: "email", label: contact.email, href: `mailto:${contact.email}` });
  if (contact.github) {
    const handle = contact.github.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    links.push({ kind: "github", label: `github.com/${handle}`, href: `https://github.com/${handle}` });
  }
  if (contact.linkedin) {
    const href = contact.linkedin.startsWith("http")
      ? contact.linkedin
      : `https://www.linkedin.com/in/${contact.linkedin.replace(/\/$/, "")}`;
    links.push({ kind: "linkedin", label: "LinkedIn", href });
  }
  return links;
}
