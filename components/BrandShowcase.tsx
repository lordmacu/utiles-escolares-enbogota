import Link from "next/link";

/** Vitrina de marcas: chips que enlazan al buscador filtrando por la marca. */
export function BrandShowcase({ marcas }: { marcas: { marca: string; count: number }[] }) {
  if (marcas.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8">
        <div className="mb-5 text-center">
          <p className="eyebrow mb-1.5">Marcas</p>
          <h2 className="font-display text-xl font-extrabold text-[var(--color-ink)] sm:text-2xl">Las marcas que confías</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {marcas.map((m) => (
            <Link
              key={m.marca}
              href={`/productos?q=${encodeURIComponent(m.marca)}`}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
            >
              {m.marca}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
