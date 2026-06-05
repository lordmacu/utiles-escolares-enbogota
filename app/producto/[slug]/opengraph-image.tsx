import { getProducto } from "@/lib/productos";
import { renderProductOg, PRODUCT_OG_SIZE, PRODUCT_OG_CONTENT_TYPE } from "@/lib/product-og";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const size = PRODUCT_OG_SIZE;
export const contentType = PRODUCT_OG_CONTENT_TYPE;
export const alt = `${SITE_NAME} — Papelería y útiles escolares en Bogotá`;

// Generada bajo demanda (sin generateStaticParams) para no inflar el build ni el
// tamaño del deploy con 3.430 JPEG; Vercel la cachea tras la primera petición.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) {
    return new Response("Not found", { status: 404 });
  }

  const jpeg = await renderProductOg({
    nombre: producto.nombre,
    marca: producto.marca,
    precio: producto.precio,
    imagen: producto.imagen,
  });

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
