import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CATEGORIAS } from "@/lib/categorias";
import { BARRIOS } from "@/lib/landings";
import { waLink } from "@/lib/site";
import config from "@/data/config.json";

// Landings SEO destacadas para el enlazado interno desde el footer.
const MAS_BUSCADOS: { label: string; slug: string }[] = [
  { label: "Útiles a domicilio", slug: "utiles-escolares-a-domicilio-bogota" },
  { label: "Papelería a domicilio", slug: "papeleria-a-domicilio-bogota" },
  { label: "Útiles baratos", slug: "utiles-escolares-baratos-bogota" },
  { label: "Al por mayor", slug: "utiles-escolares-al-por-mayor-bogota" },
  { label: "Lista de útiles", slug: "lista-de-utiles-escolares" },
  { label: "Preescolar", slug: "utiles-escolares-preescolar" },
  { label: "Primaria", slug: "utiles-escolares-primaria" },
  { label: "Bachillerato", slug: "utiles-escolares-bachillerato" },
  { label: "Cuadernos", slug: "cuadernos-escolares-bogota" },
  { label: "Morrales y loncheras", slug: "morrales-y-loncheras-escolares-bogota" },
  { label: "Colores y pinturas", slug: "colores-y-pinturas-escolares-bogota" },
  { label: "Kit escolar", slug: "kit-escolar-completo-bogota" },
];

export function Footer() {
  const year = 2026;
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {config.descripcion}
            </p>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.981 1.287 2.981.858 3.518.804.537-.054 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              </svg>
              Escríbenos
            </a>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-ink)]">Tienda</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/" className="text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">Inicio</Link></li>
              <li><Link href="/productos" className="text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">Todos los productos</Link></li>
              <li><Link href="/categorias" className="text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">Categorías</Link></li>
              <li><Link href="/carrito" className="text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">Mi carrito</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-ink)]">Categorías</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIAS.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <Link href={`/categorias/${c.slug}`} className="text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">
                    {c.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-ink)]">Contacto</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-ink-soft)]">
              <li>{config.direccion}</li>
              <li>{config.horario}</li>
              <li><a href={`mailto:${config.email}`} className="hover:text-[var(--color-primary)]">{config.email}</a></li>
              <li>
                <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)]">
                  @{config.instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Enlaces SEO: landings (más buscados + cobertura por zona) */}
        <div className="mt-12 space-y-6 border-t border-[var(--color-line)] pt-8">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-ink)]">Más buscados</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {MAS_BUSCADOS.map((l) => (
                <Link
                  key={l.slug}
                  href={`/${l.slug}`}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--color-ink)]">Útiles escolares por zona de Bogotá</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {BARRIOS.map((b) => (
                <Link
                  key={b.slug}
                  href={`/${b.slug}`}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {b.nombre}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-line)] pt-6 text-xs text-[var(--color-ink-soft)] sm:flex-row">
          <p>© {year} {config.nombre}. Útiles escolares y papelería en Bogotá.</p>
          <p>Hecho con cuidado para estudiantes y oficinas.</p>
        </div>
      </div>
    </footer>
  );
}
