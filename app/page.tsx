import Link from "next/link";
import Image from "next/image";
import { HeroCarousel, type Slide } from "@/components/HeroCarousel";
import { BenefitsStrip } from "@/components/BenefitsStrip";
import { ProductCarousel } from "@/components/ProductCarousel";
import { BrandShowcase } from "@/components/BrandShowcase";
import { Newsletter } from "@/components/Newsletter";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { CATEGORIAS } from "@/lib/categorias";
import {
  PRODUCTOS,
  getDestacados,
  getOfertas,
  getTopMarcas,
  getConteosPorCategoria,
  getProductosDeCategoria,
} from "@/lib/productos";

const catImg = (slug: string) => CATEGORIAS.find((c) => c.slug === slug)?.imagen || "";

const SLIDES: Slide[] = [
  {
    eyebrow: "Regreso a clases",
    titulo: "Todo para la lista escolar, en un solo lugar",
    subtitulo: "Cuadernos, esferos, colores y útiles de las mejores marcas, al mejor precio.",
    cta: "Ver útiles escolares",
    href: "/categorias/utiles-escolares",
    imagen: catImg("utiles-escolares"),
    bg: "bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]",
    texto: "light",
  },
  {
    eyebrow: "Fiesta y celebración",
    titulo: "Arma la fiesta perfecta",
    subtitulo: "Decoración, piñatas, globos, dulces y desechables para cualquier ocasión.",
    cta: "Ver artículos de fiesta",
    href: "/categorias/decoracion-de-fiesta",
    imagen: catImg("decoracion-de-fiesta"),
    bg: "bg-gradient-to-br from-[#f59e0b] to-[#ec4899]",
    texto: "light",
  },
  {
    eyebrow: "Morrales y loncheras",
    titulo: "Listos para empezar el año",
    subtitulo: "Morrales, loncheras y accesorios resistentes para el cole y la universidad.",
    cta: "Ver morrales",
    href: "/categorias/morrales-y-loncheras",
    imagen: catImg("morrales-y-loncheras"),
    bg: "bg-gradient-to-br from-[#0ea5e9] to-[#0d9488]",
    texto: "light",
  },
];

const PROMOS = [
  { slug: "escritura", titulo: "Escritura", sub: "Esferos, lápices, marcadores", bg: "from-[#6366f1]/90 to-[#4338ca]/90" },
  { slug: "confiteria", titulo: "Dulces y confitería", sub: "Chocolates, gomas y más", bg: "from-[#ec4899]/90 to-[#be185d]/90" },
  { slug: "accesorios-de-escritorio-y-oficina", titulo: "Oficina", sub: "Organiza tu escritorio", bg: "from-[#0d9488]/90 to-[#0f766e]/90" },
];

export default function HomePage() {
  const conteos = getConteosPorCategoria();
  const totalProductos = PRODUCTOS.length;
  const ofertas = getOfertas(12);
  const destacados = getDestacados(12);
  const utiles = getProductosDeCategoria("utiles-escolares").slice(0, 12);
  const fiesta = getProductosDeCategoria("decoracion-de-fiesta").slice(0, 12);
  const escritura = getProductosDeCategoria("escritura").slice(0, 12);
  const marcas = getTopMarcas(14);

  return (
    <div className="flex flex-col">
      {/* H1 de marca (oculto visualmente): da a la home un H1 claro y refuerza
          el "nombre del sitio" en Google. Accesible para lectores/crawlers. */}
      <h1 className="sr-only">Útiles Escolares — papelería y útiles escolares a domicilio en Bogotá</h1>

      {/* Hero: carrusel de banners */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <HeroCarousel slides={SLIDES} />
      </section>

      <div className="mt-8">
        <BenefitsStrip />
      </div>

      {/* Categorías */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Categorías</p>
            <h2 className="font-display text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">Compra por categoría</h2>
          </div>
          <Link href="/categorias" className="hidden shrink-0 text-sm font-semibold text-[var(--color-primary)] hover:underline sm:block">Ver todas →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIAS.map((c) => (
            <Link key={c.slug} href={`/categorias/${c.slug}`} className="group relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] card-hover">
              <div className="relative aspect-[5/4] overflow-hidden bg-[var(--color-primary-soft)]">
                {c.imagen && (
                  <Image src={c.imagen} alt={c.nombre} fill className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">{c.nombre}</h3>
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{conteos[c.slug] ?? 0} productos</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* En oferta */}
      {ofertas.length > 0 && (
        <div className="bg-[var(--color-surface)] py-4">
          <ProductCarousel eyebrow="Aprovecha" titulo="En oferta" productos={ofertas} verTodoHref="/productos" />
        </div>
      )}

      {/* Banners promocionales secundarios */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PROMOS.map((p) => (
            <Link key={p.slug} href={`/categorias/${p.slug}`} className="group relative h-40 overflow-hidden rounded-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${p.bg}`} />
              {catImg(p.slug) && (
                <Image src={catImg(p.slug)} alt={p.titulo} fill className="object-contain p-3 opacity-90 mix-blend-luminosity transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 text-white">
                <h3 className="font-display text-lg font-extrabold">{p.titulo}</h3>
                <p className="text-sm text-white/85">{p.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Lo más vendido */}
      <div className="bg-[var(--color-surface)] py-4">
        <ProductCarousel eyebrow="Favoritos" titulo="Lo más vendido" productos={destacados} verTodoHref="/productos" />
      </div>

      {/* Regreso a clases */}
      {utiles.length > 0 && (
        <ProductCarousel eyebrow="Temporada escolar" titulo="Para el regreso a clases" productos={utiles} verTodoHref="/categorias/utiles-escolares" />
      )}

      {/* Para la fiesta */}
      {fiesta.length > 0 && (
        <div className="bg-[var(--color-surface)] py-4">
          <ProductCarousel eyebrow="Celebra" titulo="Para la fiesta" productos={fiesta} verTodoHref="/categorias/decoracion-de-fiesta" />
        </div>
      )}

      {/* Escritura */}
      {escritura.length > 0 && (
        <ProductCarousel eyebrow="Imprescindibles" titulo="Escritura" productos={escritura} verTodoHref="/categorias/escritura" />
      )}

      {/* Vistos recientemente (cliente) */}
      <RecentlyViewed />

      <BrandShowcase marcas={marcas} />

      <Newsletter />

      {/* CTA band */}
      <section className="bg-[var(--color-primary)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-14 text-center sm:px-6 lg:px-8">
          <Link href="/categorias/utiles-escolares" className="transition-opacity hover:opacity-90">
            <h2 className="font-display text-2xl font-extrabold text-white text-balance underline-offset-4 hover:underline sm:text-3xl">
              ¿Tienes la lista escolar a la mano?
            </h2>
          </Link>
          <p className="max-w-xl text-white/80">
            Arma tu pedido con los productos que necesitas y confírmalo por WhatsApp. Nosotros nos encargamos del resto.
          </p>
          <Link href="/productos" className="btn-accent">Empezar mi pedido</Link>
          <p className="text-sm text-white/60">{totalProductos.toLocaleString("es-CO")} productos · Entrega a domicilio en Bogotá</p>
        </div>
      </section>
    </div>
  );
}
