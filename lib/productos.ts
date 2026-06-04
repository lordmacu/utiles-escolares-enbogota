/**
 * Acceso al catálogo (data/productos.json). Server-only: estos helpers se usan
 * en Server Components y en generateStaticParams.
 */
import productosJson from "@/data/productos.json";
import { CATEGORIAS, getCategoriaInfo, getSubcategoriaParent } from "@/lib/categorias";
import type { Producto, ProductoIndex } from "@/lib/types";

const TODOS = (productosJson as unknown as { productos: Producto[] }).productos;

/** Solo productos publicables (visibles y con stock). */
export const PRODUCTOS: Producto[] = TODOS.filter((p) => p.visible && (p.stock ?? 0) > 0);

export function getProducto(slug: string): Producto | undefined {
  return PRODUCTOS.find((p) => p.slug === slug);
}

/** Convierte un producto al índice liviano (lo que se envía al cliente). */
function toIndex(p: Producto): ProductoIndex {
  return {
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    marca: p.marca || "",
    precio: p.precio,
    precioAnterior: p.precioAnterior ?? null,
    imagen: p.imagen,
    categoria: p.categoria,
    catPrincipal: getSubcategoriaParent(p.categoria)?.slug || p.categoria,
    subcategoria: p.subcategoria,
    color: p.color,
    tipo: p.tipo,
    popular: !!p.popular,
  };
}

/** Índice liviano para el buscador en cliente (mucho menos peso). */
export function getProductoIndex(): ProductoIndex[] {
  return PRODUCTOS.map(toIndex);
}

/** Índice liviano de los productos de una categoría/subcategoría. */
export function getIndexDeCategoria(slug: string): ProductoIndex[] {
  return getProductosDeCategoria(slug).map(toIndex);
}

/** Productos de una categoría principal o de una subcategoría real. */
export function getProductosDeCategoria(slug: string): Producto[] {
  const esSub = getSubcategoriaParent(slug) !== null;
  if (esSub) {
    return PRODUCTOS.filter((p) => p.subcategoria === slug);
  }
  // Categoría principal: todos los productos tienen el slug de la madre en `categoria`.
  return PRODUCTOS.filter((p) => p.categoria === slug);
}

/** Subcategorías de una categoría principal que tienen al menos un producto. */
export function getSubcategoriasConProductos(mainSlug: string): { nombre: string; slug: string; count: number }[] {
  const cat = CATEGORIAS.find((c) => c.slug === mainSlug);
  if (!cat) return [];
  return (cat.subcategorias ?? [])
    .map((s) => ({ nombre: s.nombre, slug: s.slug, count: PRODUCTOS.filter((p) => p.subcategoria === s.slug).length }))
    .filter((s) => s.count > 0);
}

/** Todos los slugs de subcategoría que tienen productos (para rutear solo páginas no vacías). */
export function getSubcategoriaSlugsConProductos(): string[] {
  const con = new Set<string>();
  for (const p of PRODUCTOS) if (p.subcategoria) con.add(p.subcategoria);
  return [...con];
}

/** Mapa categoría principal → subcategorías navegables (con productos). Para el menú. */
export function getNavSubcategorias(): Record<string, { nombre: string; slug: string }[]> {
  const map: Record<string, { nombre: string; slug: string }[]> = {};
  for (const c of CATEGORIAS) {
    const subs = getSubcategoriasConProductos(c.slug).map((s) => ({ nombre: s.nombre, slug: s.slug }));
    if (subs.length) map[c.slug] = subs;
  }
  return map;
}

/** Conteo de productos por categoría principal (incluye subcategorías). */
export function getConteosPorCategoria(): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const cat of CATEGORIAS) {
    conteo[cat.slug] = getProductosDeCategoria(cat.slug).length;
  }
  return conteo;
}

/** Relacionados: misma categoría, distinto slug. */
export function getRelacionados(producto: Producto, n = 4): Producto[] {
  return PRODUCTOS.filter(
    (p) => p.categoria === producto.categoria && p.slug !== producto.slug
  ).slice(0, n);
}

/** Destacados para la home: prioriza populares, completa con el resto. */
export function getDestacados(n = 8): Producto[] {
  const populares = PRODUCTOS.filter((p) => p.popular);
  const resto = PRODUCTOS.filter((p) => !p.popular);
  return [...populares, ...resto].slice(0, n);
}

/** Productos en oferta (precioAnterior > precio), de mayor a menor descuento. */
export function getOfertas(n = 12): Producto[] {
  return PRODUCTOS.filter((p) => p.precioAnterior != null && p.precioAnterior > p.precio)
    .sort(
      (a, b) =>
        (b.precioAnterior! - b.precio) / b.precioAnterior! -
        (a.precioAnterior! - a.precio) / a.precioAnterior!
    )
    .slice(0, n);
}

/** Marcas más frecuentes (para la vitrina de marcas). */
export function getTopMarcas(n = 12): { marca: string; count: number }[] {
  const conteo = new Map<string, number>();
  for (const p of PRODUCTOS) {
    const m = (p.marca || "").trim();
    if (!m) continue;
    conteo.set(m, (conteo.get(m) ?? 0) + 1);
  }
  return [...conteo.entries()]
    .map(([marca, count]) => ({ marca, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function getNombreCategoria(slug: string): string {
  return getCategoriaInfo(slug)?.nombre || slug.replace(/-/g, " ");
}
