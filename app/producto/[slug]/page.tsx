import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductBuyBox } from "@/components/ProductBuyBox";
import { ProductSeoContent } from "@/components/ProductSeoContent";
import { RecordRecentView, RecentlyViewed } from "@/components/RecentlyViewed";
import { SITE_URL, SITE_NAME, formatCOP } from "@/lib/site";
import { loadSeo } from "@/lib/seo";
import { PRODUCTOS, getProducto, getRelacionados } from "@/lib/productos";
import { getCategoriaInfo } from "@/lib/categorias";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Solo los productos del catálogo; cualquier otro slug → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTOS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) return { title: "Producto no encontrado" };

  const seo = await loadSeo(slug);
  const fallback =
    (producto.descripcion || "").replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Compra ${producto.nombre} en Bogotá. Entrega a domicilio, pide por WhatsApp.`;

  const metaDescription = seo?.metaDescription || fallback;
  // Título SEO: nombre REAL del catálogo (evita typos del LLM) + keyword del
  // nicho + local. `absolute` para que el template del layout no duplique la marca.
  const tituloSeo = `${producto.nombre} | Comprar útiles escolares en Bogotá`;

  return {
    title: { absolute: tituloSeo },
    description: metaDescription,
    keywords: seo?.keywordsObjetivo?.join(", ") || undefined,
    alternates: { canonical: `/producto/${slug}` },
    openGraph: {
      title: tituloSeo,
      description: metaDescription,
      url: `${SITE_URL}/producto/${slug}`,
      type: "website",
      // La imagen OG (JPEG) la aporta el archivo colocado opengraph-image.tsx
      // de este segmento (WhatsApp/Facebook no previsualizan el WebP del producto).
    },
  };
}

const TRUST = [
  { label: "Entrega en Bogotá", d: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
  { label: "Pedido por WhatsApp", d: "M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
  { label: "Precios de papelería", d: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  { label: "Marcas conocidas", d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
];

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) notFound();

  const seo = await loadSeo(slug);
  const categoria = getCategoriaInfo(producto.categoria);
  const relacionados = getRelacionados(producto, 4);

  const hasDiscount = producto.precioAnterior != null && producto.precioAnterior > producto.precio;
  const descuento = hasDiscount
    ? Math.round(((producto.precioAnterior! - producto.precio) / producto.precioAnterior!) * 100)
    : 0;

  const galeria = Array.isArray(producto.galeria) ? producto.galeria : [];
  const descripcionVisible = seo?.intro
    ? seo.intro.split(/\n{2,}/)[0]?.trim() || producto.descripcion
    : producto.descripcion;

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    inLanguage: "es-CO",
    name: producto.nombre,
    description: (descripcionVisible || producto.nombre).slice(0, 400),
    image: producto.imagen ? [producto.imagen.startsWith("http") ? producto.imagen : `${SITE_URL}${producto.imagen}`] : undefined,
    sku: producto.id,
    brand: { "@type": "Brand", name: producto.marca || SITE_NAME },
    offers: {
      "@type": "Offer",
      price: producto.precio,
      priceCurrency: "COP",
      itemCondition: "https://schema.org/NewCondition",
      availability: producto.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: "2027-12-31",
      url: `${SITE_URL}/producto/${slug}`,
      seller: { "@type": "Organization", name: SITE_NAME },
      areaServed: { "@type": "City", name: "Bogotá" },
      // Política real: solo cambios (no reembolso) dentro de 5 días; el cliente
      // asume el transporte del cambio. Se coordina por WhatsApp.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "CO",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 5,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        refundType: "https://schema.org/ExchangeRefund",
      },
      // Entrega a domicilio en Bogotá. El costo del domicilio se cotiza por
      // WhatsApp (varía por dirección), por eso no se declara una tarifa fija.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "CO",
          addressRegion: "Bogotá D.C.",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
        },
      },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: categoria?.nombre || "Categorías", item: categoria ? `${SITE_URL}/categorias/${categoria.slug}` : `${SITE_URL}/categorias` },
      { "@type": "ListItem", position: 3, name: producto.nombre, item: `${SITE_URL}/producto/${slug}` },
    ],
  };

  const faqLd = seo && seo.faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: seo.faqs.map((f) => ({
          "@type": "Question",
          name: f.pregunta,
          acceptedAnswer: { "@type": "Answer", text: f.respuesta },
        })),
      }
    : null;

  const jsonLd = faqLd ? [productLd, breadcrumbLd, faqLd] : [productLd, breadcrumbLd];

  return (
    <div className="flex flex-col">
      <JsonLd data={jsonLd} />
      <RecordRecentView
        item={{
          slug: producto.slug,
          nombre: producto.nombre,
          marca: producto.marca,
          precio: producto.precio,
          precioAnterior: producto.precioAnterior ?? null,
          imagen: producto.imagen,
          categoria: producto.categoria,
          popular: producto.popular,
        }}
      />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm text-[var(--color-ink-soft)] sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
          <span>/</span>
          <Link href={`/categorias/${producto.categoria}`} className="hover:text-[var(--color-primary)]">{categoria?.nombre}</Link>
          <span>/</span>
          <span className="truncate text-[var(--color-ink)]">{producto.nombre}</span>
        </nav>
      </div>

      {/* Detalle */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery imagen={producto.imagen} galeria={galeria} alt={producto.nombre}>
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
              {producto.popular && <span className="badge badge-popular">Popular</span>}
              {hasDiscount && <span className="badge badge-discount">-{descuento}%</span>}
            </div>
          </ProductGallery>

          <div>
            {categoria && <p className="eyebrow mb-2">{categoria.nombre}</p>}
            <h1 className="font-display text-3xl font-extrabold text-[var(--color-ink)] text-balance sm:text-4xl">{producto.nombre}</h1>
            {producto.marca && (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Marca: <span className="font-semibold text-[var(--color-ink)]">{producto.marca}</span></p>
            )}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-[var(--color-primary)]">{formatCOP(producto.precio)}</span>
              {hasDiscount && <span className="price-original text-base">{formatCOP(producto.precioAnterior!)}</span>}
            </div>

            {descripcionVisible && (
              <p className="mt-5 leading-relaxed text-[var(--color-ink-soft)] text-pretty">{descripcionVisible}</p>
            )}

            <div className="mt-7">
              <ProductBuyBox
                item={{
                  slug: producto.slug,
                  nombre: producto.nombre,
                  precio: producto.precio,
                  imagen: producto.imagen,
                  categoria: producto.categoria,
                }}
              />
            </div>

            <div className="mt-7 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${producto.stock > 0 ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]"}`} />
              <span className="text-sm text-[var(--color-ink-soft)]">
                {producto.stock > 0 ? "Disponible — coordinamos la entrega por WhatsApp" : "Disponible bajo pedido"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--color-line)] pt-6 sm:grid-cols-4">
              {TRUST.map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-2 text-center">
                  <svg className="h-6 w-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.d} />
                  </svg>
                  <span className="text-xs text-[var(--color-ink-soft)]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEO editorial */}
      {seo && <ProductSeoContent seo={seo} />}

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="mb-8 font-display text-2xl font-extrabold text-[var(--color-ink)]">También te puede servir</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relacionados.map((r) => (
              <ProductCard key={r.slug} producto={r} />
            ))}
          </div>
        </section>
      )}

      {/* Vistos recientemente (cliente, localStorage) */}
      <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <RecentlyViewed excludeSlug={slug} />
      </div>
    </div>
  );
}
