"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { formatCOP } from "@/lib/site";
import type { ProductoIndex } from "@/lib/types";

interface SubChip {
  nombre: string;
  slug: string;
  count: number;
}

const PAGE = 24;
type Orden = "relevancia" | "precio-asc" | "precio-desc";

function countBy(items: ProductoIndex[], key: "color" | "marca" | "tipo"): { value: string; count: number }[] {
  const m = new Map<string, number>();
  for (const p of items) {
    const v = (p[key] || "").trim();
    if (v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

/** Sección colapsable del sidebar. */
function Section({ titulo, children, defaultOpen = true }: { titulo: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--color-line)] py-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left font-semibold text-[var(--color-ink)]">
        {titulo}
        <svg className={`h-4 w-4 text-[var(--color-ink-soft)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function CategoryFilter({
  productos,
  subcategorias = [],
}: {
  productos: ProductoIndex[];
  subcategorias?: SubChip[];
}) {
  const [subcat, setSubcat] = useState("");
  const [tipos, setTipos] = useState<Set<string>>(new Set());
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [visible, setVisible] = useState(PAGE * 2);
  const [panelOpen, setPanelOpen] = useState(false);

  // Base por subcategoría (las facetas se calculan sobre esta base).
  const base = useMemo(
    () => (subcat ? productos.filter((p) => p.subcategoria === subcat) : productos),
    [productos, subcat]
  );

  const tipoFacet = useMemo(() => countBy(base, "tipo"), [base]);
  const colorFacet = useMemo(() => countBy(base, "color"), [base]);
  const brandFacet = useMemo(() => countBy(base, "marca"), [base]);
  const bounds = useMemo(() => {
    let lo = Infinity, hi = 0;
    for (const p of base) { if (p.precio < lo) lo = p.precio; if (p.precio > hi) hi = p.precio; }
    if (!isFinite(lo)) lo = 0;
    return { lo: Math.floor(lo), hi: Math.ceil(hi) };
  }, [base]);

  const [precio, setPrecio] = useState<[number, number] | null>(null);
  const rango: [number, number] = precio ?? [bounds.lo, bounds.hi];

  const filtrados = useMemo(() => {
    let res = base;
    if (tipos.size) res = res.filter((p) => p.tipo && tipos.has(p.tipo));
    if (colors.size) res = res.filter((p) => p.color && colors.has(p.color));
    if (brands.size) res = res.filter((p) => p.marca && brands.has(p.marca));
    if (precio) res = res.filter((p) => p.precio >= precio[0] && p.precio <= precio[1]);
    if (orden === "precio-asc") res = [...res].sort((a, b) => a.precio - b.precio);
    else if (orden === "precio-desc") res = [...res].sort((a, b) => b.precio - a.precio);
    else res = [...res].sort((a, b) => Number(b.popular) - Number(a.popular));
    return res;
  }, [base, tipos, colors, brands, precio, orden]);

  const mostrados = filtrados.slice(0, visible);
  const algunFiltro = subcat || tipos.size || colors.size || brands.size || precio;

  function reset(setter: () => void) { setter(); setVisible(PAGE * 2); }
  function toggle(set: Set<string>, val: string): Set<string> {
    const n = new Set(set);
    n.has(val) ? n.delete(val) : n.add(val);
    return n;
  }
  function limpiar() {
    setSubcat(""); setTipos(new Set()); setColors(new Set()); setBrands(new Set()); setPrecio(null); setVisible(PAGE * 2);
  }

  const sidebar = (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">Filtros</h2>
        {algunFiltro ? (
          <button type="button" onClick={limpiar} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Limpiar</button>
        ) : null}
      </div>

      {subcategorias.length > 0 && (
        <Section titulo="Categoría">
          <ul className="space-y-1.5 text-sm">
            <li>
              <button type="button" onClick={() => reset(() => setSubcat(""))} className={`flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left ${subcat === "" ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
                Todas
              </button>
            </li>
            {subcategorias.map((s) => (
              <li key={s.slug}>
                <button type="button" onClick={() => reset(() => setSubcat(s.slug))} className={`flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left ${subcat === s.slug ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}>
                  <span>{s.nombre}</span>
                  <span className="text-xs text-[var(--color-ink-soft)]/70">{s.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tipoFacet.length > 1 && (
        <Section titulo="Tipo de producto">
          <ul className="max-h-60 space-y-1.5 overflow-y-auto pr-1 text-sm">
            {tipoFacet.map((t) => (
              <li key={t.value}>
                <label className="flex cursor-pointer items-center gap-2 text-[var(--color-ink-soft)]">
                  <input type="checkbox" checked={tipos.has(t.value)} onChange={() => reset(() => setTipos((s) => toggle(s, t.value)))} className="h-4 w-4 rounded border-[var(--color-line)] accent-[var(--color-primary)]" />
                  <span className="flex-1">{t.value}</span>
                  <span className="text-xs text-[var(--color-ink-soft)]/70">{t.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {colorFacet.length > 0 && (
        <Section titulo="Color">
          <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1 text-sm">
            {colorFacet.map((c) => (
              <li key={c.value}>
                <label className="flex cursor-pointer items-center gap-2 text-[var(--color-ink-soft)]">
                  <input type="checkbox" checked={colors.has(c.value)} onChange={() => reset(() => setColors((s) => toggle(s, c.value)))} className="h-4 w-4 rounded border-[var(--color-line)] accent-[var(--color-primary)]" />
                  <span className="flex-1">{c.value}</span>
                  <span className="text-xs text-[var(--color-ink-soft)]/70">{c.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {brandFacet.length > 1 && (
        <Section titulo="Marca" defaultOpen={false}>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
            {brandFacet.map((b) => (
              <li key={b.value}>
                <label className="flex cursor-pointer items-center gap-2 text-[var(--color-ink-soft)]">
                  <input type="checkbox" checked={brands.has(b.value)} onChange={() => reset(() => setBrands((s) => toggle(s, b.value)))} className="h-4 w-4 rounded border-[var(--color-line)] accent-[var(--color-primary)]" />
                  <span className="flex-1 truncate" title={b.value}>{b.value}</span>
                  <span className="text-xs text-[var(--color-ink-soft)]/70">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {bounds.hi > bounds.lo && (
        <Section titulo="Rango de precio">
          <div className="price-range mb-2">
            <div className="track" />
            <div
              className="fill"
              style={{
                left: `${((rango[0] - bounds.lo) / (bounds.hi - bounds.lo)) * 100}%`,
                right: `${100 - ((rango[1] - bounds.lo) / (bounds.hi - bounds.lo)) * 100}%`,
              }}
            />
            <input
              type="range" min={bounds.lo} max={bounds.hi} value={rango[0]}
              onChange={(e) => { const v = Math.min(Number(e.target.value), rango[1]); reset(() => setPrecio([v, rango[1]])); }}
              aria-label="Precio mínimo"
            />
            <input
              type="range" min={bounds.lo} max={bounds.hi} value={rango[1]}
              onChange={(e) => { const v = Math.max(Number(e.target.value), rango[0]); reset(() => setPrecio([rango[0], v])); }}
              aria-label="Precio máximo"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-[var(--color-ink-soft)]">
            <span>{formatCOP(rango[0])}</span>
            <span>{formatCOP(rango[1])}</span>
          </div>
        </Section>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block">
        <div className="lg:sticky lg:top-24">{sidebar}</div>
      </aside>

      {/* Contenido */}
      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-ink-soft)]">
            <span className="font-semibold text-[var(--color-ink)]">{filtrados.length}</span> productos
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium lg:hidden">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6 12h12m-9 5.25h6" /></svg>
              Filtros
            </button>
            <select value={orden} onChange={(e) => reset(() => setOrden(e.target.value as Orden))} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]">
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
            </select>
          </div>
        </div>

        {mostrados.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {mostrados.map((p) => (
                <ProductCard key={p.slug} producto={p} />
              ))}
            </div>
            {visible < filtrados.length && (
              <div className="mt-10 text-center">
                <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="btn-secondary">
                  Ver más ({filtrados.length - visible})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] py-16 text-center">
            <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Sin resultados con estos filtros</p>
            <button type="button" onClick={limpiar} className="btn-primary mt-4">Limpiar filtros</button>
          </div>
        )}
      </div>

      {/* Sidebar móvil (drawer) */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setPanelOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-[var(--color-bg)] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-bold">Filtros</span>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Cerrar" className="rounded-full p-2 hover:bg-[var(--color-primary-soft)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {sidebar}
            <button type="button" onClick={() => setPanelOpen(false)} className="btn-primary mt-4 w-full">Ver {filtrados.length} productos</button>
          </div>
        </div>
      )}
    </div>
  );
}
