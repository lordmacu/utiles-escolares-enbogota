/**
 * OG image por producto en JPEG (WhatsApp/Facebook NO previsualizan WebP).
 * Se compone con sharp —que decodifica WebP y codifica JPEG nativamente, sin el
 * problema de WebP de next/og— la foto del producto sobre una tarjeta de marca.
 */
import sharp from "sharp";
import { SITE_NAME, SITE_URL, formatCOP } from "@/lib/site";

export const PRODUCT_OG_SIZE = { width: 1200, height: 630 };
export const PRODUCT_OG_CONTENT_TYPE = "image/jpeg";

const W = PRODUCT_OG_SIZE.width;
const H = PRODUCT_OG_SIZE.height;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Trocea un texto en "palabras" que quepan en maxChars: parte por espacios, luego
 * por "/" (común en papelería: "Portalapiz/Organizador/...") y como último recurso
 * corta en duro los tokens que aún excedan el ancho. */
function tokenize(text: string, maxChars: number): string[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (w.length <= maxChars ? [w] : w.split(/(?<=\/)/)))
    .flatMap((w) => {
      if (w.length <= maxChars) return [w];
      const chunks: string[] = [];
      for (let i = 0; i < w.length; i += maxChars) chunks.push(w.slice(i, i + maxChars));
      return chunks;
    });
}

/** Parte un texto en líneas por palabras, con tope de caracteres y de líneas (… si sobra). */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = tokenize(text, maxChars);
  const lines: string[] = [];
  let cur = "";
  let i = 0;
  for (; i < words.length; i++) {
    const cand = cur ? `${cur} ${words[i]}` : words[i];
    if (cand.length > maxChars && cur) {
      lines.push(cur);
      cur = words[i];
      if (lines.length === maxLines) {
        cur = "";
        break;
      }
    } else {
      cur = cand;
    }
  }
  if (cur && lines.length < maxLines) {
    lines.push(cur);
    i = words.length;
  }
  if (i < words.length && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:]?$/, "") + "…";
  }
  return lines;
}

export interface ProductOgInput {
  nombre: string;
  marca?: string;
  precio: number;
  imagen: string;
}

/**
 * Carga los bytes de la imagen del producto por HTTP desde el CDN del sitio.
 *
 * NO leemos public/ con fs: como `imagen` es dinámico, el bundler trazaba TODO
 * public/ (14.104 archivos, ~269MB) dentro de esta función serverless y el
 * deploy fallaba al superar el límite de tamaño de función. La función OG es
 * dinámica (se renderiza on-demand), así que siempre hay red disponible.
 */
async function loadImageBytes(imagen: string): Promise<Buffer | null> {
  try {
    const url = imagen.startsWith("http") ? imagen : `${SITE_URL}${imagen}`;
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {
    // sin imagen → tarjeta de marca sin foto
  }
  return null;
}

/** Devuelve el JPEG (Buffer) de la tarjeta OG de un producto. */
export async function renderProductOg(p: ProductOgInput): Promise<Buffer> {
  // Foto del producto (contain en 400×400, fondo transparente).
  let productBuf: Buffer | null = null;
  const bytes = p.imagen ? await loadImageBytes(p.imagen) : null;
  if (bytes) {
    try {
      productBuf = await sharp(bytes)
        .resize(400, 400, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
    } catch {
      productBuf = null;
    }
  }

  const titleLines = wrap(p.nombre, 20, 3);
  const titleSvg = titleLines
    .map((ln, idx) => `<text x="600" y="${196 + idx * 62}" class="title">${esc(ln)}</text>`)
    .join("");

  const marca = (p.marca || "").trim();
  const marcaSvg = marca
    ? `<text x="600" y="${402}" class="brand">${esc(marca.toUpperCase())}</text>`
    : "";

  const precio = esc(formatCOP(p.precio));

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="1" stop-color="#faf5ff"/>
    </linearGradient>
  </defs>
  <style>
    text { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; }
    .eyebrow { font-size: 30px; font-weight: 700; fill: #4f46e5; letter-spacing: 4px; }
    .title { font-size: 50px; font-weight: 800; fill: #0f172a; }
    .brand { font-size: 26px; font-weight: 700; fill: #64748b; letter-spacing: 2px; }
    .price { font-size: 62px; font-weight: 800; fill: #4f46e5; }
    .cta { font-size: 27px; font-weight: 700; fill: #1f1300; }
    .url { font-size: 24px; font-weight: 600; fill: #94a3b8; }
  </style>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="56" y="95" width="480" height="440" rx="36" fill="#ffffff"/>
  <text x="600" y="128" class="eyebrow">${esc(SITE_NAME.toUpperCase())}</text>
  ${titleSvg}
  ${marcaSvg}
  <text x="600" y="476" class="price">${precio}</text>
  <rect x="600" y="512" width="430" height="62" rx="31" fill="#f59e0b"/>
  <text x="624" y="552" class="cta">Pedir por WhatsApp · Bogotá</text>
  <text x="600" y="600" class="url">utilesescolares.enbogota.app</text>
</svg>`;

  const base = sharp(Buffer.from(svg));
  const composited = productBuf ? base.composite([{ input: productBuf, top: 115, left: 96 }]) : base;
  return composited.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
