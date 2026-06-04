"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { ProductoIndex } from "@/lib/types";

interface CatChip {
  slug: string;
  nombre: string;
  count: number;
}

const PAGE = 24;

type Orden = "relevancia" | "precio-asc" | "precio-desc";

/** Quita tildes y pasa a minúsculas para buscar sin acentos. */
function norm(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function SearchableProducts({
  productos,
  categorias,
  navSubs = {},
  initialCategoria = "",
  initialQuery = "",
}: {
  productos: ProductoIndex[];
  categorias: CatChip[];
  navSubs?: Record<string, { nombre: string; slug: string }[]>;
  initialCategoria?: string;
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState(initialCategoria);
  const [subcat, setSubcat] = useState("");
  const [marca, setMarca] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [visible, setVisible] = useState(PAGE);

  // Base según categoría (define qué marcas mostrar en el filtro).
  const base = useMemo(() => {
    let b = cat ? productos.filter((p) => p.catPrincipal === cat) : productos;
    if (cat && subcat) b = b.filter((p) => p.subcategoria === subcat);
    return b;
  }, [productos, cat, subcat]);

  const subcategorias = cat ? navSubs[cat] ?? [] : [];

  const marcasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const p of base) if (p.marca) set.add(p.marca);
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [base]);

  const filtrados = useMemo(() => {
    const nq = norm(q.trim());
    const min = precioMin ? Number(precioMin) : null;
    const max = precioMax ? Number(precioMax) : null;
    let res = base;
    if (marca) res = res.filter((p) => p.marca === marca);
    if (min != null) res = res.filter((p) => p.precio >= min);
    if (max != null) res = res.filter((p) => p.precio <= max);
    if (nq) {
      const terms = nq.split(/\s+/);
      res = res.filter((p) => {
        const hay = norm(`${p.nombre} ${p.marca}`);
        return terms.every((t) => hay.includes(t));
      });
    }
    if (orden === "precio-asc") res = [...res].sort((a, b) => a.precio - b.precio);
    else if (orden === "precio-desc") res = [...res].sort((a, b) => b.precio - a.precio);
    else if (!nq) res = [...res].sort((a, b) => Number(b.popular) - Number(a.popular));
    return res;
  }, [base, q, marca, precioMin, precioMax, orden]);

  const mostrados = filtrados.slice(0, visible);
  const hayFiltros = q || cat || subcat || marca || precioMin || precioMax;

  function setFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setVisible(PAGE);
  }
  function cambiarCat(slug: string) {
    setCat(slug);
    setSubcat(""); // las subcategorías y marcas dependen de la categoría
    setMarca("");
    setVisible(PAGE);
  }
  function limpiar() {
    setQ("");
    setCat("");
    setSubcat("");
    setMarca("");
    setPrecioMin("");
    setPrecioMax("");
    setVisible(PAGE);
  }

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-5">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="search"
          inputMode="search"
          value={q}
          onChange={(e) => setFilter(setQ, e.target.value)}
          placeholder="Busca cuadernos, esferos, morrales, colores…"
          aria-label="Buscar productos"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] py-3.5 pl-12 pr-4 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      {/* Chips de categorías */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cambiarCat("")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${cat === "" ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
        >
          Todo
        </button>
        {categorias.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => cambiarCat(c.slug)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${cat === c.slug ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Subcategorías (cuando hay una categoría seleccionada) */}
      {subcategorias.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(setSubcat, "")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${subcat === "" ? "bg-[var(--color-ink)] text-white" : "border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"}`}
          >
            Toda la categoría
          </button>
          {subcategorias.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setFilter(setSubcat, s.slug)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${subcat === s.slug ? "bg-[var(--color-ink)] text-white" : "border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"}`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Filtros: marca, precio, orden */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={marca}
          onChange={(e) => setFilter(setMarca, e.target.value)}
          aria-label="Filtrar por marca"
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Todas las marcas</option>
          {marcasDisponibles.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={precioMin}
            onChange={(e) => setFilter(setPrecioMin, e.target.value)}
            placeholder="$ mín"
            aria-label="Precio mínimo"
            className="w-24 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 outline-none focus:border-[var(--color-primary)]"
          />
          <span className="text-[var(--color-ink-soft)]">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={precioMax}
            onChange={(e) => setFilter(setPrecioMax, e.target.value)}
            placeholder="$ máx"
            aria-label="Precio máximo"
            className="w-24 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="orden" className="text-[var(--color-ink-soft)]">Ordenar:</label>
          <select
            id="orden"
            value={orden}
            onChange={(e) => setFilter(setOrden, e.target.value as Orden)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
          </select>
        </div>

        {hayFiltros && (
          <button type="button" onClick={limpiar} className="ml-auto rounded-lg px-3 py-1.5 font-medium text-[var(--color-primary)] hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      <p className="mb-5 text-sm text-[var(--color-ink-soft)]">
        <span className="font-semibold text-[var(--color-ink)]">{filtrados.length}</span> productos
        {cat && <> en <span className="font-semibold text-[var(--color-ink)]">{categorias.find((c) => c.slug === cat)?.nombre}</span></>}
        {marca && <> · marca <span className="font-semibold text-[var(--color-ink)]">{marca}</span></>}
        {q && <> para “{q}”</>}
      </p>

      {mostrados.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {mostrados.map((p) => (
              <ProductCard key={p.slug} producto={p} />
            ))}
          </div>
          {visible < filtrados.length && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="btn-secondary">
                Ver más productos ({filtrados.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] py-16 text-center">
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Sin resultados</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Prueba con otra palabra o quita los filtros.</p>
          <button type="button" onClick={limpiar} className="btn-primary mt-4">Limpiar filtros</button>
        </div>
      )}
    </div>
  );
}
