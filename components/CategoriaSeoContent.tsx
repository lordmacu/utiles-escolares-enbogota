import type { CategoriaSeo } from "@/lib/seo";

/**
 * Contenido editorial/SEO de una página de categoría. Server Component: todo el
 * HTML va en el primer response (bueno para SEO/GEO). Incluye intro, destacados
 * y FAQs. El FAQPage JSON-LD lo inyecta la página.
 */
export function CategoriaSeoContent({ seo, nombre }: { seo: CategoriaSeo; nombre: string }) {
  const parrafos = seo.intro.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        {parrafos.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-3">Sobre {nombre.toLowerCase()}</p>
            <div className="space-y-4 text-[1.05rem] leading-relaxed text-[var(--color-ink-soft)] text-pretty">
              {parrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}

        {seo.destacados.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Qué encontrarás</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {seo.destacados.map((d, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--color-ink)]">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="leading-snug">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {seo.faqs.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Preguntas frecuentes</p>
            <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
              {seo.faqs.map((f, i) => (
                <details key={i} className="group py-4" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <h2 className="font-display text-base font-semibold text-[var(--color-ink)] text-balance sm:text-lg">{f.pregunta}</h2>
                    <span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--color-primary)]/40 text-[var(--color-primary)] transition-transform group-open:rotate-45">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)] text-pretty">{f.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
