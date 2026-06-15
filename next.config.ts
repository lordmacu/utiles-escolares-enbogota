import type { NextConfig } from "next";

// process.cwd() (no __dirname): compila en ESM (SWC WASM, Termux) y CJS (PC).
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto aquí. Evita que Next infiera mal la raíz por un
  // package-lock.json huérfano en un directorio padre.
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  // distDir gateado: el celu construye en .next-build y hace swap atómico.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Source maps de servidor/browser consumen mucha RAM y no se necesitan para
  // un sitio estático de miles de páginas.
  productionBrowserSourceMaps: false,
  experimental: {
    // === Control de memoria en build (SSG de ~3.430 productos + categorías) ===
    // Gateado por env: en el celu (RAM compartida con otras apps) bajamos; Vercel usa 4.
    cpus: Number(process.env.NEXT_BUILD_CPUS) || 4,
    memoryBasedWorkersCount: true,
    staticGenerationMaxConcurrency: Number(process.env.NEXT_BUILD_CONC) || 4,
    staticGenerationMinPagesPerWorker: 50,
    serverSourceMaps: false,
    preloadEntriesOnStart: false,
    imgOptConcurrency: 2,
  },
  images: {
    // En el celu (Termux) no hay `sharp` nativo: con NO_IMAGE_OPT=1 se sirven sin
    // optimizar. En Vercel no se setea → optimiza normal.
    unoptimized: process.env.NO_IMAGE_OPT === "1",
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
