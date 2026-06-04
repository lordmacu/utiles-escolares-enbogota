/**
 * Blog: noticias (data/blog.json) y guías (data/guias.json). Server-only.
 * Las imágenes se resuelven desde productos/categorías reales del catálogo, no
 * desde imágenes de blog generadas.
 */
import blogJson from "@/data/blog.json";
import guiasJson from "@/data/guias.json";
import { getIndexDeCategoria } from "@/lib/productos";
import { getCategoriaInfo } from "@/lib/categorias";
import type { ProductoIndex } from "@/lib/types";

export interface BlogItem {
  titulo: string;
  texto: string;
  /** Categoría destino del CTA (una de las 14 categorías principales). */
  ctaCategoria: string;
  ctaTexto: string;
}

export interface Post {
  slug: string;
  metaTitle: string;
  h1: string;
  metaDescription: string;
  excerpt: string;
  fecha: string; // YYYY-MM-DD
  etiqueta: string;
  /** Categoría de la que se toma la imagen del hero. */
  heroCategoria: string;
  lead: string;
  intro: string[];
  items: BlogItem[];
  /** Secciones de fondo (prosa multi-párrafo) para dar profundidad editorial/SEO. */
  secciones?: { titulo: string; parrafos: string[] }[];
  cierre: string[];
  faq: { pregunta: string; respuesta: string }[];
  categoriasRelacionadas: string[];
}

export interface GuiaSeccion {
  titulo: string;
  parrafos: string[];
}

export interface Guia {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  excerpt: string;
  fecha: string; // YYYY-MM-DD
  /** Categoría de la que se toma la imagen del hero. */
  imagenCategoria: string;
  categoriasRelacionadas: string[];
  lead: string;
  secciones: GuiaSeccion[];
  faq: { pregunta: string; respuesta: string }[];
}

export const POSTS = (blogJson as { posts: Post[] }).posts;
export const GUIAS = (guiasJson as { guias: Guia[] }).guias;

export const getPost = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);
export const getGuia = (slug: string): Guia | undefined => GUIAS.find((g) => g.slug === slug);

export const getPostSlugs = (): string[] => POSTS.map((p) => p.slug);
export const getGuiaSlugs = (): string[] => GUIAS.map((g) => g.slug);

/** Producto representativo de una categoría (popular primero) para ilustrar. */
export function representativeProducto(catSlug: string): ProductoIndex | undefined {
  const list = getIndexDeCategoria(catSlug);
  return list.find((p) => p.popular) ?? list[0];
}

/** Imagen para ilustrar una categoría: producto representativo o imagen propia. */
export function imagenDeCategoria(catSlug: string): string {
  return representativeProducto(catSlug)?.imagen || getCategoriaInfo(catSlug)?.imagen || "";
}

/** Productos (deduplicados, populares primero) de varias categorías. */
export function productosDeCategorias(cats: string[], limit = 4): ProductoIndex[] {
  const seen = new Set<string>();
  const out: ProductoIndex[] = [];
  for (const c of cats) {
    for (const p of getIndexDeCategoria(c)) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push(p);
    }
  }
  out.sort((a, b) => Number(b.popular) - Number(a.popular));
  return out.slice(0, limit);
}

/** Formatea "YYYY-MM-DD" a fecha legible en es-CO sin desfase de zona horaria. */
export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
