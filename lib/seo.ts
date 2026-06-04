import { promises as fs } from "node:fs";
import path from "node:path";

export interface SeoEspecificacion {
  item: string;
  detalle: string;
}

export interface SeoFaq {
  pregunta: string;
  respuesta: string;
}

/** Contenido editorial/SEO por producto (data/seo/<slug>.json). */
export interface SeoContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  highlights: string[];
  paraQuien: string;
  usos: string[];
  especificaciones: SeoEspecificacion[];
  cuidados: string[];
  faqs: SeoFaq[];
  keywordsObjetivo: string[];
}

const SEO_DIR = path.join(process.cwd(), "data", "seo");
const SEO_CAT_DIR = path.join(process.cwd(), "data", "seo-categorias");

export async function loadSeo(slug: string): Promise<SeoContent | null> {
  try {
    const raw = await fs.readFile(path.join(SEO_DIR, `${slug}.json`), "utf8");
    const parsed = JSON.parse(raw) as SeoContent;
    if (!parsed || typeof parsed !== "object" || parsed.slug !== slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Contenido SEO editorial por categoría/subcategoría. */
export interface CategoriaSeo {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  destacados: string[];
  faqs: SeoFaq[];
  keywordsObjetivo: string[];
}

export async function loadCategoriaSeo(slug: string): Promise<CategoriaSeo | null> {
  try {
    const raw = await fs.readFile(path.join(SEO_CAT_DIR, `${slug}.json`), "utf8");
    const parsed = JSON.parse(raw) as CategoriaSeo;
    if (!parsed || typeof parsed !== "object" || parsed.slug !== slug) return null;
    return parsed;
  } catch {
    return null;
  }
}
