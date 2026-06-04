#!/usr/bin/env node
/**
 * generate-content.mjs
 *
 * Genera contenido editorial para el blog del sitio usando MiniMax y lo agrega a
 * data/blog.json (noticias) o data/guias.json (guías). Pensado para correr de
 * forma automática 3 veces por semana (cron / GitHub Actions) y, con --commit,
 * hace git add + commit + push (lo que dispara el deploy en Vercel).
 *
 * NOTICIAS: usa "búsqueda" real vía Google News RSS (Colombia, español, sin API
 * key). Toma titulares recientes sobre educación / regreso a clases / papelería
 * y le pide a MiniMax una noticia ORIGINAL para la tienda, partiendo de esa
 * actualidad. Nunca copia titulares.
 *
 * GUÍAS: parten del catálogo (categorías/productos), no necesitan búsqueda.
 *
 * En ambos casos el contenido:
 *   - Se escribe humanizado (prompts/humanize-text.md) para no "sonar a IA".
 *   - Referencia categorías/productos REALES del sitio (enlazado interno).
 *   - Trae metaTitle/metaDescription/FAQ optimizados para SEO (las páginas ya
 *     emiten JSON-LD BlogPosting/Article + Breadcrumb + FAQPage).
 *
 * Uso:
 *   node scripts/generate-content.mjs                 # auto (rota noticia/guía)
 *   node scripts/generate-content.mjs --type=noticia  # forzar noticia
 *   node scripts/generate-content.mjs --type=guia     # forzar guía
 *   node scripts/generate-content.mjs --dry-run       # genera pero NO escribe
 *   node scripts/generate-content.mjs --commit        # escribe + git push
 *
 * Variables de entorno (.env.local o entorno real):
 *   LLM_API_KEY, LLM_BASE_URL (default https://api.minimax.io/anthropic),
 *   LLM_MODEL (default MiniMax-M3), LLM_API_STYLE (auto), LLM_MAX_TOKENS.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BLOG_FILE = path.join(ROOT, "data", "blog.json");
const GUIAS_FILE = path.join(ROOT, "data", "guias.json");
const CATEGORIAS_FILE = path.join(ROOT, "data", "categorias.json");
const PRODUCTOS_FILE = path.join(ROOT, "data", "productos.json");
const CONFIG_FILE = path.join(ROOT, "data", "config.json");
const HUMANIZE_FILE = path.join(ROOT, "prompts", "humanize-text.md");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────────────────────── entorno ─────────────────────────────
async function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = await readFile(path.join(ROOT, file), "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/i);
        if (m && !process.env[m[1]]) {
          let v = m[2];
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          process.env[m[1]] = v;
        }
      }
    } catch {
      /* sin archivo: ok */
    }
  }
}

function parseArgs(argv) {
  const args = { type: "auto", dryRun: false, commit: false, noPull: false };
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--commit") args.commit = true;
    else if (a === "--no-pull") args.noPull = true;
    else if (a.startsWith("--type=")) args.type = a.slice(7);
  }
  return args;
}

// ──────────────────────────── utilidades ───────────────────────────
function slugify(text, maxLen = 65) {
  const base = text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  // Corta en límite de palabra (no a mitad de palabra).
  const words = base.split("-").filter(Boolean);
  let slug = "";
  for (const w of words) {
    if (slug && slug.length + 1 + w.length > maxLen) break;
    slug = slug ? `${slug}-${w}` : w;
  }
  return slug || "articulo";
}

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .trim();
}

function hoyBogota() {
  // YYYY-MM-DD en zona horaria de Bogotá.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

// ───────────────── "búsqueda" real: Google News RSS ────────────────
async function buscarNoticias(query, max = 8) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=CO&ceid=CO:es-419`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, max);
    return items
      .map((m) => {
        const block = m[1];
        const rawTitle = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
        const source = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || "";
        const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
        let title = decodeEntities(rawTitle);
        const src = decodeEntities(source);
        if (src && title.endsWith(` - ${src}`)) title = title.slice(0, -(src.length + 3));
        return { title: title.trim(), source: src, date: pub.trim() };
      })
      .filter((n) => n.title.length > 15);
  } catch {
    return [];
  }
}

// ────────────────────────── LLM (MiniMax) ──────────────────────────
function resolveApiStyle(style, baseUrl) {
  const s = (style || "auto").toLowerCase();
  if (s === "openai" || s === "anthropic") return s;
  return /\/anthropic(?:\/|$)/i.test(baseUrl) ? "anthropic" : "openai";
}

function extractJson(text) {
  let t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```\s*$/);
  if (fenced) t = fenced[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new SyntaxError("No se encontró JSON válido en la respuesta del modelo");
  }
}

async function callLlm({ system, user, baseUrl, apiKey, model, apiStyle, maxTokens = 16000, maxRetries = 4 }) {
  const base = baseUrl.replace(/\/+$/, "");
  let lastErr = null;
  let tokens = maxTokens;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let url, headers, body;
      if (apiStyle === "anthropic") {
        url = `${base}/v1/messages`;
        headers = { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
        body = { model, max_tokens: tokens, temperature: 0.8, system, messages: [{ role: "user", content: user }] };
      } else {
        url = `${base}/chat/completions`;
        headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
        body = { model, temperature: 0.8, max_tokens: tokens, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
      }
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const errBody = await res.text();
        lastErr = new Error(`HTTP ${res.status}: ${errBody.slice(0, 300)}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 429) throw lastErr;
      } else {
        const data = await res.json();
        const stop = data.stop_reason || data.choices?.[0]?.finish_reason;
        const content =
          apiStyle === "anthropic"
            ? (data.content || []).filter((b) => b?.type === "text").map((b) => b.text).join("")
            : data.choices?.[0]?.message?.content;
        if ((stop === "max_tokens" || stop === "length") && tokens < 32000) {
          tokens = Math.min(tokens * 2, 32000);
          continue;
        }
        if (!content) throw new Error("Respuesta vacía del modelo");
        return content;
      }
    } catch (e) {
      lastErr = e;
    }
    if (attempt < maxRetries) await sleep(800 * 2 ** (attempt - 1));
  }
  throw lastErr;
}

// ──────────────────── imagen (MiniMax image-01) ────────────────────
// Endpoint NATIVO (PAYG), no el de /anthropic. Fotorrealista, personas reales.
const IMG_BASE = "https://api.minimax.io";
const IMG_STYLE =
  "photorealistic editorial photography, REAL PEOPLE, candid, Colombian / Latin American families, parents and school children, students in a classroom or at home studying, natural daylight, warm authentic tones, shallow depth of field, high quality magazine look, no text, no letters, no words, no watermark, no logo, no brand names";

async function generateImagen(slug, imagePrompt, apiKey, outDir) {
  if (!imagePrompt) return null;
  try {
    const res = await fetch(`${IMG_BASE}/v1/image_generation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "image-01",
        prompt: `${imagePrompt}. ${IMG_STYLE}`,
        width: 1536,
        height: 960,
        response_format: "url",
        n: 1,
        prompt_optimizer: true,
      }),
    });
    const json = await res.json();
    if (json?.base_resp?.status_code !== 0 || !json?.data?.image_urls?.length) {
      console.error("  ⚠ imagen:", JSON.stringify(json?.base_resp || json).slice(0, 200));
      return null;
    }
    const buf = Buffer.from(await (await fetch(json.data.image_urls[0])).arrayBuffer());
    await mkdir(outDir, { recursive: true });
    // WebP si hay sharp (PC); si no (celular/Termux), guarda el JPG original.
    let ext = "jpg";
    let out = buf;
    try {
      const sharp = (await import("sharp")).default;
      out = await sharp(buf).webp({ quality: 84 }).toBuffer();
      ext = "webp";
    } catch {
      /* sin sharp: se guarda el original */
    }
    const file = path.join(outDir, `${slug}.${ext}`);
    await writeFile(file, out);
    console.error(`  🎨 imagen: /images/blog/${slug}.${ext} (${(out.length / 1024).toFixed(0)} KB)`);
    return { rel: `/images/blog/${slug}.${ext}`, file };
  } catch (e) {
    console.error("  ⚠ imagen falló (continúo sin imagen):", String(e.message || e).split("\n")[0]);
    return null;
  }
}

// ───────────────────────── prompts ─────────────────────────
function reglasHumanas(humanizeText) {
  const es = [
    "## REGLAS DE ESCRITURA HUMANA (OBLIGATORIAS, máxima prioridad)",
    "El texto se publica para posicionar en Google y debe leerse 100% humano, nunca como IA.",
    "- Frases cortas (10-20 palabras), voz activa, vocabulario cotidiano y concreto.",
    "- Varía el largo de las frases. Ritmo natural, no mecánico.",
    "- PROHIBIDO el guion largo (—) y el punto y coma (;). Usa punto o coma.",
    "- PROHIBIDOS clichés de IA en español: 'En resumen', 'En conclusión', 'En definitiva',",
    "  'Es importante destacar/mencionar', 'cabe resaltar', 'cabe destacar', 'sin lugar a dudas',",
    "  'en la era digital', 'en el mundo de', 'sumérgete en', 'descubre el mundo de', 'eleva tu',",
    "  'lleva al siguiente nivel', 'no es solo... es', 'ya sea... o', 'cuando se trata de', 'a la hora de'.",
    "- No empieces oraciones ni ítems con conectores tipo 'Además', 'Asimismo', 'Sin embargo',",
    "  'Por lo tanto', 'Por ende', 'Igualmente', 'De igual manera'.",
    "- Nada de metáforas de viajes, música o paisajes. Nada de emojis. Sin mayúsculas para enfatizar.",
    "- No te refieras a ti mismo ni a que eres una IA. No te disculpes. Afirma con seguridad.",
    "- Español de Colombia (Bogotá), natural y cercano.",
  ].join("\n");
  return humanizeText.trim() ? `${es}\n\n--- Guía completa (inglés, aplica por analogía) ---\n${humanizeText.trim()}` : es;
}

function systemBase(store, humanizeText) {
  return [
    `Eres el editor del blog de "${store.nombre}", una tienda de útiles escolares y papelería a domicilio en Bogotá, Colombia.`,
    `Pedidos por WhatsApp. Vendes: cuadernos, esferos, lápices, colores, témperas, morrales, loncheras, carpetas, artículos de oficina y de fiesta escolar.`,
    `Escribes contenido editorial original, útil y optimizado para SEO, que ayuda a posicionar el sitio y a que los lectores compren.`,
    "",
    reglasHumanas(humanizeText),
    "",
    "## SEO (obligatorio)",
    "- metaTitle: 50-60 caracteres, con la keyword principal y mención a Bogotá cuando aplique.",
    "- metaDescription: 140-155 caracteres, con keyword y un llamado a la acción.",
    "- El h1 debe contener la keyword principal de forma natural.",
    "- Incluye SIEMPRE referencias a categorías/productos REALES del sitio (enlazado interno).",
    "- Las FAQ deben responder dudas reales de compra (entrega, precios, cómo pedir).",
    "",
    "Devuelves SOLO un objeto JSON válido, sin texto extra ni fences de markdown.",
  ].join("\n");
}

function promptNoticia({ store, cats, noticias, fecha, humanizeText }) {
  const catList = cats.map((c) => `${c.slug} (${c.nombre})`).join(", ");
  const titulares = noticias.length
    ? noticias.map((n, i) => `${i + 1}. ${n.title}${n.source ? ` [${n.source}]` : ""}`).join("\n")
    : "(sin titulares disponibles: escribe una noticia de temporada escolar basada en la fecha actual)";
  const system = systemBase(store, humanizeText);
  const user = [
    `Hoy es ${fecha}. Escribe una NOTICIA para el blog, partiendo de la actualidad reciente de Colombia.`,
    "",
    "Titulares recientes (contexto; NO los copies, inspírate y conéctalos con útiles escolares / papelería / regreso a clases):",
    titulares,
    "",
    `Categorías reales del sitio (usa SOLO estos slugs): ${catList}`,
    "",
    "Devuelve un JSON con EXACTAMENTE esta forma:",
    `{
  "metaTitle": "string 50-60 chars con keyword + Bogotá",
  "h1": "titular periodístico atractivo con keyword",
  "metaDescription": "string 140-155 chars con keyword y CTA",
  "excerpt": "1 frase gancho de 120-160 chars",
  "etiqueta": "etiqueta corta (ej: Regreso a clases, Ahorro, Tendencias, Calendario)",
  "heroCategoria": "un slug de la lista",
  "lead": "1 frase potente que abre el artículo",
  "intro": ["párrafo 1", "párrafo 2"],
  "items": [
    { "titulo": "subtítulo con gancho", "texto": "2-3 frases que conectan la noticia con un tipo de producto/categoría que vendemos", "ctaCategoria": "slug de la lista", "ctaTexto": "Ver cuadernos" }
  ],
  "secciones": [
    { "titulo": "subtítulo de análisis", "parrafos": ["párrafo de contexto de fondo, útil y con keywords naturales", "segundo párrafo"] }
  ],
  "cierre": ["párrafo de cierre con invitación a pedir por WhatsApp / a domicilio en Bogotá"],
  "faq": [ { "pregunta": "...", "respuesta": "..." } ],
  "categoriasRelacionadas": ["slug", "slug", "slug"],
  "imagePrompt": "descripción EN INGLÉS de una foto fotorrealista con PERSONAS REALES sobre el tema; si habla de colegio, muestra niños en el colegio/salón o papás con sus hijos comprando o alistando útiles; escena natural y cálida, sin texto en la imagen"
}`,
    "",
    "Requisitos: 4 a 5 items (cada uno con un ctaCategoria distinto y real), 2 a 3 secciones de análisis (prosa de fondo), 3 a 4 faq, 3 categoriasRelacionadas reales, e imagePrompt en inglés con personas reales.",
    "La noticia debe ser ORIGINAL y útil, conectando la actualidad con la compra de útiles. Solo JSON.",
  ].join("\n");
  return { system, user };
}

function promptGuia({ store, cats, brief, fecha, humanizeText }) {
  const catList = cats.map((c) => `${c.slug} (${c.nombre})`).join(", ");
  const system = systemBase(store, humanizeText);
  const user = [
    `Hoy es ${fecha}. Escribe una GUÍA práctica (evergreen) sobre el siguiente tema:`,
    `TEMA: ${brief.tema}`,
    `Categoría principal sugerida: ${brief.categoria}`,
    "",
    `Categorías reales del sitio (usa SOLO estos slugs): ${catList}`,
    "",
    "Devuelve un JSON con EXACTAMENTE esta forma:",
    `{
  "title": "string SEO 50-60 chars con keyword",
  "h1": "título con keyword",
  "metaDescription": "string 140-155 chars con keyword y CTA",
  "excerpt": "1 frase gancho de 120-160 chars",
  "imagenCategoria": "un slug de la lista",
  "categoriasRelacionadas": ["slug", "slug", "slug"],
  "lead": "1 frase que abre la guía",
  "secciones": [ { "titulo": "subtítulo claro", "parrafos": ["párrafo 1", "párrafo 2"] } ],
  "faq": [ { "pregunta": "...", "respuesta": "..." } ],
  "imagePrompt": "descripción EN INGLÉS de una foto fotorrealista con PERSONAS REALES sobre el tema; si habla de colegio, muestra niños en el colegio/salón o papás con sus hijos alistando útiles; escena natural y cálida, sin texto en la imagen"
}`,
    "",
    "Requisitos: 4 a 5 secciones, 3 a 4 faq, 3 categoriasRelacionadas reales (la primera = imagenCategoria), e imagePrompt en inglés con personas reales.",
    "La guía debe mencionar tipos de producto que vendemos y orientar a comprar por WhatsApp / a domicilio en Bogotá. Solo JSON.",
  ].join("\n");
  return { system, user };
}

// ─────────────────────── validación / saneo ───────────────────────
function fixCat(slug, validSet, fallback = "utiles-escolares") {
  return validSet.has(slug) ? slug : fallback;
}
function trimMeta(s, max) {
  if (typeof s !== "string") return "";
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max - 20 ? cut.slice(0, sp) : cut).trim();
}

function sanitizeNoticia(obj, validSet, fecha, existingSlugs) {
  const req = ["metaTitle", "h1", "metaDescription", "excerpt", "etiqueta", "lead", "intro", "items", "cierre", "faq"];
  for (const k of req) if (!(k in obj)) throw new Error(`noticia: falta campo "${k}"`);
  if (!Array.isArray(obj.items) || obj.items.length < 3) throw new Error("noticia: items < 3");
  if (!Array.isArray(obj.faq) || obj.faq.length < 3) throw new Error("noticia: faq < 3");

  const out = {
    slug: uniqueSlug(slugify(obj.h1), existingSlugs),
    metaTitle: trimMeta(obj.metaTitle, 60),
    h1: String(obj.h1).trim(),
    metaDescription: trimMeta(obj.metaDescription, 158),
    excerpt: String(obj.excerpt).trim(),
    fecha,
    etiqueta: String(obj.etiqueta).trim().slice(0, 24),
    heroCategoria: fixCat(obj.heroCategoria, validSet),
    lead: String(obj.lead).trim(),
    intro: (obj.intro || []).map(String),
    items: obj.items.slice(0, 5).map((it) => ({
      titulo: String(it.titulo).trim(),
      texto: String(it.texto).trim(),
      ctaCategoria: fixCat(it.ctaCategoria, validSet),
      ctaTexto: String(it.ctaTexto || "Ver productos").trim().slice(0, 32),
    })),
    cierre: (obj.cierre || []).map(String),
    faq: obj.faq.slice(0, 5).map((f) => ({ pregunta: String(f.pregunta).trim(), respuesta: String(f.respuesta).trim() })),
    categoriasRelacionadas: dedupeCats(obj.categoriasRelacionadas, validSet, obj.heroCategoria),
  };
  // Secciones de fondo (opcionales): solo si vienen bien formadas.
  if (Array.isArray(obj.secciones) && obj.secciones.length) {
    out.secciones = obj.secciones
      .filter((s) => s && s.titulo && Array.isArray(s.parrafos) && s.parrafos.length)
      .slice(0, 4)
      .map((s) => ({ titulo: String(s.titulo).trim(), parrafos: s.parrafos.map(String) }));
  }
  return out;
}

function sanitizeGuia(obj, validSet, fecha, existingSlugs) {
  const req = ["title", "h1", "metaDescription", "excerpt", "lead", "secciones", "faq"];
  for (const k of req) if (!(k in obj)) throw new Error(`guia: falta campo "${k}"`);
  if (!Array.isArray(obj.secciones) || obj.secciones.length < 3) throw new Error("guia: secciones < 3");
  if (!Array.isArray(obj.faq) || obj.faq.length < 3) throw new Error("guia: faq < 3");

  const imagenCategoria = fixCat(obj.imagenCategoria, validSet);
  return {
    slug: uniqueSlug(slugify(obj.h1 || obj.title), existingSlugs),
    title: trimMeta(obj.title, 60),
    h1: String(obj.h1).trim(),
    metaDescription: trimMeta(obj.metaDescription, 158),
    excerpt: String(obj.excerpt).trim(),
    fecha,
    imagenCategoria,
    categoriasRelacionadas: dedupeCats(obj.categoriasRelacionadas, validSet, imagenCategoria),
    lead: String(obj.lead).trim(),
    secciones: obj.secciones.slice(0, 6).map((s) => ({
      titulo: String(s.titulo).trim(),
      parrafos: (s.parrafos || []).map(String),
    })),
    faq: obj.faq.slice(0, 5).map((f) => ({ pregunta: String(f.pregunta).trim(), respuesta: String(f.respuesta).trim() })),
  };
}

function dedupeCats(arr, validSet, first) {
  const out = [];
  for (const c of [first, ...(Array.isArray(arr) ? arr : [])]) {
    const v = fixCat(c, validSet);
    if (!out.includes(v)) out.push(v);
  }
  while (out.length < 3) out.push("utiles-escolares");
  return out.slice(0, 4);
}

function uniqueSlug(base, existing) {
  let slug = base || "articulo";
  let i = 2;
  while (existing.has(slug)) slug = `${base}-${i++}`;
  existing.add(slug);
  return slug;
}

// ─────────────────────── briefs / rotación ─────────────────────────
const NOTICIA_QUERIES = [
  "regreso a clases Colombia 2026",
  "calendario escolar Colombia",
  "útiles escolares precios Colombia",
  "educación colegios Bogotá",
  "lista de útiles escolares Colombia",
  "matrículas colegios Colombia",
  "costo regreso a clases Colombia",
  "papelería Colombia temporada escolar",
];
const GUIA_BRIEFS = [
  { tema: "Cómo elegir el cuaderno correcto para cada materia", categoria: "utiles-escolares" },
  { tema: "Guía para comprar morral y lonchera que duren todo el año", categoria: "morrales-y-loncheras" },
  { tema: "Qué útiles de escritura necesita un estudiante (esferos, lápices, resaltadores)", categoria: "escritura" },
  { tema: "Materiales de arte y manualidades para el colegio", categoria: "pintar" },
  { tema: "Cómo organizar y clasificar los trabajos del colegio con carpetas y folders", categoria: "archivos-y-clasificacion" },
  { tema: "Papel, blocks y resmas: cuál elegir para cada uso", categoria: "papeles-y-blocks" },
  { tema: "Cómo montar un escritorio de estudio en casa", categoria: "accesorios-de-escritorio-y-oficina" },
  { tema: "Ideas para celebrar fechas especiales en el salón de clases", categoria: "decoracion-de-fiesta" },
];

function pickIndex(list, n) {
  return list[((n % list.length) + list.length) % list.length];
}

// ───────────────────────────── git ─────────────────────────────────
function git(args) {
  return execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
}
function currentBranch() {
  try { return git(["rev-parse", "--abbrev-ref", "HEAD"]); } catch { return "main"; }
}
function commitPush(files, message) {
  // Asegura identidad lordmacu (no la cuenta de trabajo).
  try { git(["config", "user.name", "lordmacu"]); } catch { /* ok */ }
  try { git(["config", "user.email", "10134930+lordmacu@users.noreply.github.com"]); } catch { /* ok */ }
  for (const f of (Array.isArray(files) ? files : [files])) git(["add", path.relative(ROOT, f)]);
  // Solo commitea si NUESTRO archivo quedó staged (no toca el resto del working tree).
  if (!git(["diff", "--cached", "--name-only"])) { console.error("· nada que commitear"); return; }
  git(["commit", "-m", message]);
  const branch = currentBranch();
  // Cron-safe: trae cambios remotos (la PC también empuja) antes de pushear.
  try { git(["pull", "--rebase", "origin", branch]); } catch (e) { console.error("⚠ pull --rebase:", e.message); }
  git(["push", "origin", branch]);
  console.error("✓ commit + push hechos");
}

// Trae cambios remotos antes de generar (la PC y el celular empujan al mismo
// branch). No es fatal: si falla, se sigue con lo que haya en local.
function gitPull() {
  try {
    const branch = currentBranch();
    const out = git(["pull", "--rebase", "--autostash", "origin", branch]);
    console.error(`↻ git pull --rebase origin ${branch}: ${(out.split("\n").pop() || "ok").trim()}`);
  } catch (e) {
    console.error("⚠ git pull falló (continúo con lo local):", String(e.message || e).split("\n")[0]);
  }
}

// ───────────────────────────── main ────────────────────────────────
async function main() {
  await loadEnv();
  const args = parseArgs(process.argv);

  const baseUrl = process.env.LLM_BASE_URL || "https://api.minimax.io/anthropic";
  const model = process.env.LLM_MODEL || "MiniMax-M3";
  const apiKey = process.env.LLM_API_KEY || "";
  const apiStyle = resolveApiStyle(process.env.LLM_API_STYLE, baseUrl);
  const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || "", 10) || 16000;
  if (!apiKey) { console.error("Error: falta LLM_API_KEY (definir en .env.local)"); process.exit(1); }

  // Antes de generar nada, traemos lo último del remoto (salvo --no-pull).
  if (!args.noPull) gitPull();

  const [categoriasData, productosData, config, humanizeText] = await Promise.all([
    readFile(CATEGORIAS_FILE, "utf8").then(JSON.parse),
    readFile(PRODUCTOS_FILE, "utf8").then(JSON.parse).catch(() => ({ productos: [] })),
    readFile(CONFIG_FILE, "utf8").then(JSON.parse),
    readFile(HUMANIZE_FILE, "utf8").catch(() => ""),
  ]);
  const cats = categoriasData.categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }));
  const validSet = new Set(cats.map((c) => c.slug));
  const store = { nombre: config.nombre, dominio: config.dominio, whatsapp: config.whatsapp };
  const fecha = hoyBogota();

  const blog = JSON.parse(await readFile(BLOG_FILE, "utf8"));
  const guias = JSON.parse(await readFile(GUIAS_FILE, "utf8"));

  // Tipo: auto rota 2 noticias : 1 guía según el total ya publicado.
  let type = args.type;
  if (type === "auto") {
    const total = blog.posts.length + guias.guias.length;
    type = total % 3 === 2 ? "guia" : "noticia";
  }
  if (!["noticia", "guia"].includes(type)) { console.error(`--type inválido: ${type}`); process.exit(1); }

  console.error(`[generate-content] type=${type} model=${model} fecha=${fecha} ${args.dryRun ? "DRY-RUN" : ""}`);

  let nuevo, system, user, targetFile, dataObj, arrKey, contexto = "";

  if (type === "noticia") {
    const query = pickIndex(NOTICIA_QUERIES, blog.posts.length);
    const noticias = await buscarNoticias(query);
    contexto = `query="${query}" titulares=${noticias.length}`;
    console.error(`  búsqueda: ${contexto}`);
    ({ system, user } = promptNoticia({ store, cats, noticias, fecha, humanizeText }));
    targetFile = BLOG_FILE; dataObj = blog; arrKey = "posts";
  } else {
    const brief = pickIndex(GUIA_BRIEFS, guias.guias.length);
    contexto = `brief="${brief.tema}"`;
    console.error(`  tema: ${contexto}`);
    ({ system, user } = promptGuia({ store, cats, brief, fecha, humanizeText }));
    targetFile = GUIAS_FILE; dataObj = guias; arrKey = "guias";
  }

  const existingSlugs = new Set(dataObj[arrKey].map((x) => x.slug));
  const content = await callLlm({ system, user, baseUrl, apiKey, model, apiStyle, maxTokens });
  const raw = extractJson(content);
  nuevo = type === "noticia"
    ? sanitizeNoticia(raw, validSet, fecha, existingSlugs)
    : sanitizeGuia(raw, validSet, fecha, existingSlugs);

  const tituloSeo = nuevo.metaTitle || nuevo.title;
  console.error(`\n→ ${type}: ${nuevo.h1}`);
  console.error(`  slug: ${nuevo.slug}`);
  console.error(`  título SEO (${tituloSeo.length}): ${tituloSeo}`);
  console.error(`  metaDescription (${nuevo.metaDescription.length})`);
  console.error(`  categorías referenciadas: ${type === "noticia" ? nuevo.items.map((i) => i.ctaCategoria).join(", ") : nuevo.categoriasRelacionadas.join(", ")}`);

  if (args.dryRun) {
    console.error(`  imagePrompt: ${(raw.imagePrompt || "(ninguno)").slice(0, 120)}`);
    console.error("\nDRY-RUN: no se escribió nada (ni imagen).\n", JSON.stringify(nuevo, null, 2).slice(0, 800), "…");
    return;
  }

  // Imagen del blog (best-effort): MiniMax image-01, escena fotorrealista con personas reales.
  const imgDir = path.join(ROOT, "public", "images", "blog");
  const img = await generateImagen(nuevo.slug, raw.imagePrompt, apiKey, imgDir);
  if (img) nuevo.heroImagen = img.rel;

  // Inserta al inicio (lo más nuevo primero) y escribe.
  dataObj[arrKey].unshift(nuevo);
  await writeFile(targetFile, JSON.stringify(dataObj, null, 2) + "\n", "utf8");
  console.error(`✓ agregado a ${path.relative(ROOT, targetFile)} (${dataObj[arrKey].length} en total)`);

  if (args.commit) {
    const ruta = type === "noticia" ? `/blog/${nuevo.slug}` : `/guias/${nuevo.slug}`;
    const files = [targetFile];
    if (img) files.push(img.file);
    commitPush(files, `Contenido auto: ${type} "${nuevo.h1}" (${ruta})`);
  }
}

main().catch((e) => { console.error("ERROR:", e.message || e); process.exit(1); });
