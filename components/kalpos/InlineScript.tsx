/**
 * A script that runs while the HTML is parsed, before the first paint
 * (Next guide "preventing flash before hydration"). On the client it is
 * rendered as text/plain so React never re-executes it; the element the
 * script touched carries suppressHydrationWarning.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
