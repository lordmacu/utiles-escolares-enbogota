import Link from "next/link";
import Image from "next/image";
import { formatCOP } from "@/lib/site";
import { nombreCategoria } from "@/lib/categorias";
import { AddToCartButton } from "@/components/AddToCartButton";

interface CardProducto {
  nombre: string;
  slug: string;
  marca?: string;
  precio: number;
  precioAnterior: number | null;
  imagen: string;
  categoria: string;
  popular?: boolean;
}

/**
 * Tarjeta de producto. Server Component salvo el botón "Agregar" (isla cliente).
 * El enlace al detalle se estira sobre toda la tarjeta; el botón queda por
 * encima para seguir siendo clicable.
 */
export function ProductCard({ producto, priority = false }: { producto: CardProducto; priority?: boolean }) {
  const hasDiscount = producto.precioAnterior != null && producto.precioAnterior > producto.precio;
  const descuento = hasDiscount
    ? Math.round(((producto.precioAnterior! - producto.precio) / producto.precioAnterior!) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] card-hover">
      <div className="img-zoom relative aspect-square overflow-hidden bg-[var(--color-primary-soft)]">
        {producto.imagen ? (
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            priority={priority}
            className="object-contain p-3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary)]/40">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {producto.popular && <span className="badge badge-popular">Popular</span>}
          {hasDiscount && <span className="badge badge-discount">-{descuento}%</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          {producto.marca || nombreCategoria(producto.categoria)}
        </p>
        <h3 className="mb-3 font-display text-[0.98rem] font-semibold leading-snug text-[var(--color-ink)] line-clamp-2 transition-colors group-hover:text-[var(--color-primary)]">
          <Link href={`/producto/${producto.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {producto.nombre}
          </Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {hasDiscount && <span className="price-original">{formatCOP(producto.precioAnterior!)}</span>}
            <span className="price-current text-lg">{formatCOP(producto.precio)}</span>
          </div>
          <AddToCartButton
            item={{
              slug: producto.slug,
              nombre: producto.nombre,
              precio: producto.precio,
              imagen: producto.imagen,
              categoria: producto.categoria,
            }}
          />
        </div>
      </div>
    </div>
  );
}
