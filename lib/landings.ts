/**
 * Landings SEO (data/landings.json). Páginas de aterrizaje por intención,
 * nivel educativo, barrio de Bogotá y producto estrella. Server-only.
 */
import landingsJson from "@/data/landings.json";
import { getIndexDeCategoria } from "@/lib/productos";
import type { ProductoIndex } from "@/lib/types";

export interface LandingBeneficio {
  titulo: string;
  texto: string;
}

export interface LandingFaq {
  pregunta: string;
  respuesta: string;
}

export interface Landing {
  slug: string;
  tipo: "intencion" | "nivel" | "barrio" | "producto";
  title: string;
  metaDescription: string;
  h1: string;
  subtitulo: string;
  keywords: string[];
  /** Categorías principales de las que se nutre el grid de productos. */
  categoriasFuente: string[];
  /** Filtro opcional por nombre (para landings de producto estrella). */
  filtroNombre?: string[];
  /** Categoría destino del botón "Ver catálogo". */
  ctaCategoria: string;
  intro: string[];
  beneficios: LandingBeneficio[];
  faq: LandingFaq[];
  // Solo landings de barrio:
  zonaNombre?: string;
  puntosReferencia?: string[];
}

export const LANDINGS = (landingsJson as { landings: Landing[] }).landings;

/** Barrios (para el enlazado interno de cobertura local). */
export const BARRIOS = LANDINGS.filter((l) => l.tipo === "barrio").map((l) => ({
  nombre: l.zonaNombre ?? l.h1,
  slug: l.slug,
}));

export function getLandingSlugs(): string[] {
  return LANDINGS.map((l) => l.slug);
}

export function getLanding(slug: string): Landing | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}

/**
 * Productos para el grid de una landing: une las categorías fuente, deduplica
 * por slug, aplica el filtro por nombre (si existe) y prioriza populares.
 */
export function getProductosLanding(landing: Landing, limit = 8): ProductoIndex[] {
  const seen = new Set<string>();
  const out: ProductoIndex[] = [];
  const filtro = landing.filtroNombre?.map((f) => f.toLowerCase());

  for (const cat of landing.categoriasFuente) {
    for (const p of getIndexDeCategoria(cat)) {
      if (seen.has(p.slug)) continue;
      if (filtro && !filtro.some((f) => p.nombre.toLowerCase().includes(f))) continue;
      seen.add(p.slug);
      out.push(p);
    }
  }

  // Populares primero, sin alterar el resto del orden.
  out.sort((a, b) => Number(b.popular) - Number(a.popular));
  return out.slice(0, limit);
}
