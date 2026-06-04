/**
 * Inyecta datos estructurados (JSON-LD) en el HTML renderizado en servidor.
 * Server Component: el <script> queda en el HTML inicial, ideal para SEO/GEO.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
