import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto aquí. Evita que Next infiera mal la raíz por un
  // package-lock.json huérfano en un directorio padre.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  // Source maps de servidor/browser consumen mucha RAM y no se necesitan para
  // un sitio estático de miles de páginas.
  productionBrowserSourceMaps: false,
  experimental: {
    // === Control de memoria en build (SSG de ~3.430 productos + categorías) ===
    // Sin estos topes, Next lanza un worker por core y satura la RAM.
    cpus: 4,
    memoryBasedWorkersCount: true,
    staticGenerationMaxConcurrency: 4,
    staticGenerationMinPagesPerWorker: 50,
    serverSourceMaps: false,
    preloadEntriesOnStart: false,
    imgOptConcurrency: 2,
  },
  images: {
    // Las imágenes son self-host (/images/shop/*.webp). Este patrón queda como
    // fallback para las pocas referencias que sigan apuntando al CDN de VTEX.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lostreselefantes.vteximg.com.br",
        pathname: "/arquivos/**",
      },
    ],
  },
};

export default nextConfig;
