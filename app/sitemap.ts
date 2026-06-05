import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllCategoriaSlugs } from "@/lib/categorias";
import { PRODUCTOS, getSubcategoriaSlugsConProductos } from "@/lib/productos";
import { getLandingSlugs } from "@/lib/landings";
import { POSTS, GUIAS, heroDe, imagenDeCategoria } from "@/lib/blog";

/** Convierte una ruta local (/images/...) en URL absoluta para el image sitemap. */
const abs = (src: string): string => (src.startsWith("http") ? src : `${SITE_URL}${src}`);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-06-04");

  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/productos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/ofertas`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/categorias`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/guias`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/nosotros`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Blog y guías: imagen del hero (IA o categoría) como image sitemap.
  // lastModified real = fecha de publicación de cada entrada (no un valor fijo).
  const fechaDe = (iso?: string): Date => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? new Date(iso) : now);

  const posts: MetadataRoute.Sitemap = POSTS.map((p) => {
    const img = heroDe(p).src;
    return {
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: fechaDe(p.fecha),
      changeFrequency: "monthly",
      priority: 0.6,
      images: img ? [abs(img)] : undefined,
    };
  });

  const guias: MetadataRoute.Sitemap = GUIAS.map((g) => {
    const img = heroDe(g).src;
    return {
      url: `${SITE_URL}/guias/${g.slug}`,
      lastModified: fechaDe(g.fecha),
      changeFrequency: "monthly",
      priority: 0.6,
      images: img ? [abs(img)] : undefined,
    };
  });

  // Categorías y subcategorías: imagen representativa de la categoría.
  const categorias: MetadataRoute.Sitemap = [
    ...getAllCategoriaSlugs(),
    ...getSubcategoriaSlugsConProductos(),
  ].map((slug) => {
    const img = imagenDeCategoria(slug);
    return {
      url: `${SITE_URL}/categorias/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      images: img ? [abs(img)] : undefined,
    };
  });

  const landings: MetadataRoute.Sitemap = getLandingSlugs().map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Productos: imagen principal de cada producto (la gran ganancia para Google Images).
  const productos: MetadataRoute.Sitemap = PRODUCTOS.map((p) => ({
    url: `${SITE_URL}/producto/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
    images: p.imagen ? [abs(p.imagen)] : undefined,
  }));

  return [...estaticas, ...landings, ...categorias, ...posts, ...guias, ...productos];
}
