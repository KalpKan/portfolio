import type { Contact } from "@/lib/site";

/**
 * A mono contact row under the hero. Renders nothing at all while every value
 * is empty, so the hero can be filled in later from lib/site.ts alone.
 */
export default function ContactRow({ contact }: { contact: Contact }) {
  const links: { label: string; href: string }[] = [];
  if (contact.email) links.push({ label: contact.email, href: `mailto:${contact.email}` });
  if (contact.github) {
    const handle = contact.github.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    links.push({ label: `github.com/${handle}`, href: `https://github.com/${handle}` });
  }
  if (contact.linkedin) {
    const url = contact.linkedin.startsWith("http")
      ? contact.linkedin
      : `https://www.linkedin.com/in/${contact.linkedin.replace(/\/$/, "")}`;
    links.push({ label: "LinkedIn", href: url });
  }
  if (links.length === 0) return null;

  return (
    <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-ink-2 tabular">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target={l.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={l.href.startsWith("mailto:") ? undefined : "noreferrer"}
          className="-my-3.5 inline-flex min-h-10 items-center hover:text-ink hover:underline"
        >
          {l.label}
        </a>
      ))}
    </p>
  );
}
