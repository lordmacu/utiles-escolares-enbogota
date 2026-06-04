/**
 * Resuelve qué archivo JSON cargar según el slug de categoría.
 * Subcategorías: /data/scraped/{slug}.json
 * Categorías principales: combinan los JSON de sus subcategorías.
 */

import categoriasJson from "@/data/categorias.json";

export interface Subcategoria {
  nombre: string;
  slug: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  imagen: string;
  popular: boolean;
  subcategorias: Subcategoria[];
}

const categorias = categoriasJson as unknown as { categorias: Categoria[] };

export const CATEGORIAS: Categoria[] = categorias.categorias;

/**
 * Slugs ruteables = solo las 14 categorías principales.
 *
 * El scraper de VTEX bajó productos al nivel de categoría principal (los 14
 * hijos de "Piñatería y Papelería"), no a nivel de subcategoría. Por eso los
 * productos solo tienen el slug de la categoría madre y las subcategorías no
 * tienen productos propios. Para no generar páginas vacías/duplicadas (malo
 * para SEO), no ruteamos subcategorías. Las subcategorías de categorias.json
 * quedan como descripción del contenido, no como rutas.
 */
export function getAllCategoriaSlugs(): string[] {
  return CATEGORIAS.map((c) => c.slug);
}

export function getCategoriaInfo(slug: string): Categoria | null {
  const cat = CATEGORIAS.find((c) => c.slug === slug);
  if (cat) return cat;

  for (const c of CATEGORIAS) {
    const sub = (c.subcategorias ?? []).find((s) => s.slug === slug);
    if (sub) {
      return {
        id: sub.slug,
        nombre: sub.nombre,
        slug: sub.slug,
        descripcion: c.descripcion,
        imagen: c.imagen,
        popular: c.popular,
        subcategorias: [],
      };
    }
  }
  return null;
}

/** Nombre legible de una categoría/subcategoría. Liviano (solo categorias.json),
 *  seguro para usar en componentes cliente. */
export function nombreCategoria(slug: string): string {
  return getCategoriaInfo(slug)?.nombre || slug.replace(/-/g, " ");
}

export function getSubcategoriaParent(slug: string): Categoria | null {
  for (const cat of CATEGORIAS) {
    if ((cat.subcategorias ?? []).some((s) => s.slug === slug)) return cat;
  }
  return null;
}

export function getBreadcrumb(slug: string): { nombre: string; slug: string }[] {
  const principal = CATEGORIAS.find((c) => c.slug === slug);
  if (principal) return [{ nombre: principal.nombre, slug: principal.slug }];

  for (const cat of CATEGORIAS) {
    const sub = (cat.subcategorias ?? []).find((s) => s.slug === slug);
    if (sub) {
      return [
        { nombre: cat.nombre, slug: cat.slug },
        { nombre: sub.nombre, slug: sub.slug },
      ];
    }
  }
  return [];
}
