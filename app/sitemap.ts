import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllCategoriaSlugs } from "@/lib/categorias";
import { PRODUCTOS, getSubcategoriaSlugsConProductos } from "@/lib/productos";
import { getLandingSlugs } from "@/lib/landings";
import { getPostSlugs, getGuiaSlugs } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-06-04");

  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/productos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/ofertas`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/categorias`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/guias`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const contenido: MetadataRoute.Sitemap = [
    ...getPostSlugs().map((slug) => `${SITE_URL}/blog/${slug}`),
    ...getGuiaSlugs().map((slug) => `${SITE_URL}/guias/${slug}`),
  ].map((url) => ({ url, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 }));

  const categorias: MetadataRoute.Sitemap = [
    ...getAllCategoriaSlugs(),
    ...getSubcategoriaSlugsConProductos(),
  ].map((slug) => ({
    url: `${SITE_URL}/categorias/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const landings: MetadataRoute.Sitemap = getLandingSlugs().map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productos: MetadataRoute.Sitemap = PRODUCTOS.map((p) => ({
    url: `${SITE_URL}/producto/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...estaticas, ...landings, ...categorias, ...contenido, ...productos];
}
