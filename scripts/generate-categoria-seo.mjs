#!/usr/bin/env node
/**
 * generate-categoria-seo.mjs
 *
 * Genera contenido SEO por categoría/subcategoría en data/seo-categorias/<slug>.json
 * usando el mismo LLM (MiniMax) y guías humanize que generate-seo.mjs.
 *
 * Idempotente (salta los existentes; --force regenera). Uso:
 *   node scripts/generate-categoria-seo.mjs [--force] [--slug=...] [--dry-run]
 */

import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PRODUCTOS = path.join(ROOT, "data", "productos.json");
const CATEGORIAS = path.join(ROOT, "data", "categorias.json");
const OUT_DIR = path.join(ROOT, "data", "seo-categorias");
const PROMPT_FILE = path.join(ROOT, "prompts", "categoria-seo.md");
const HUMANIZE_FILE = path.join(ROOT, "prompts", "humanize-text.md");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    } catch { /* sin archivo */ }
  }
}

function resolveApiStyle(style, baseUrl) {
  const s = (style || "auto").toLowerCase();
  if (s === "openai" || s === "anthropic") return s;
  return /\/anthropic(?:\/|$)/i.test(baseUrl) ? "anthropic" : "openai";
}

function extractJson(text) {
  let t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```\s*$/);
  if (fenced) t = fenced[1].trim();
  try { return JSON.parse(t); }
  catch {
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a !== -1 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new SyntaxError("No se encontró JSON válido");
  }
}

function buildSystem(rawPrompt, humanize) {
  const base = rawPrompt.replace(/## INSTRUCCIÓN FINAL[\s\S]*$/m, "").trim();
  if (!humanize.trim()) return base;
  const es = [
    "## REGLAS DE ESCRITURA HUMANA (OBLIGATORIAS)",
    "Debe leerse 100% humano, nunca como texto de IA. Frases cortas, voz activa,",
    "vocabulario cotidiano. PROHIBIDO el guion largo (—) y el punto y coma (;).",
    "PROHIBIDOS clichés de IA en español: 'En resumen', 'En conclusión', 'Es importante",
    "destacar', 'cabe resaltar', 'sin duda', 'en la era digital', 'sumérgete en',",
    "'descubre el mundo de', 'eleva tu', 'no es solo... es'. No empieces oraciones con",
    "'Además', 'Asimismo', 'Sin embargo', 'Por lo tanto'. Sin emojis. Sin mayúsculas para enfatizar.",
    "",
    humanize.trim(),
  ].join("\n");
  return `${base}\n\n---\n\n${es}`;
}

async function callLlm({ system, user, baseUrl, apiKey, model, apiStyle, maxTokens = 8192, maxRetries = 5 }) {
  let lastErr = null;
  const base = baseUrl.replace(/\/+$/, "");
  let tokens = maxTokens;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let url, headers, body;
      if (apiStyle === "anthropic") {
        url = `${base}/v1/messages`;
        headers = { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
        body = { model, max_tokens: tokens, temperature: 0.6, system, messages: [{ role: "user", content: user }] };
      } else {
        url = `${base}/chat/completions`;
        headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
        body = { model, temperature: 0.6, max_tokens: tokens, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
      }
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const errBody = await res.text();
        lastErr = new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 429) throw lastErr;
      } else {
        const data = await res.json();
        const stop = data.stop_reason || data.choices?.[0]?.finish_reason;
        const content = apiStyle === "anthropic"
          ? (data.content || []).filter((b) => b?.type === "text").map((b) => b.text).join("")
          : data.choices?.[0]?.message?.content;
        if ((stop === "max_tokens" || stop === "length") && tokens < 32000) { tokens = Math.min(tokens * 2, 32000); continue; }
        if (!content) throw new Error("Respuesta vacía del LLM");
        return content;
      }
    } catch (e) { lastErr = e; }
    if (attempt < maxRetries) { await sleep(800 * 2 ** (attempt - 1)); }
  }
  throw lastErr;
}

function validate(obj, slug) {
  if (!obj || typeof obj !== "object" || obj.slug !== slug) return "slug/objeto inválido";
  for (const k of ["metaTitle", "metaDescription", "intro", "destacados", "faqs", "keywordsObjetivo"])
    if (!(k in obj)) return `falta ${k}`;
  if (typeof obj.metaTitle !== "string" || obj.metaTitle.length < 20 || obj.metaTitle.length > 80) return "metaTitle longitud";
  if (typeof obj.metaDescription !== "string" || obj.metaDescription.length < 100 || obj.metaDescription.length > 185) return "metaDescription longitud";
  const trim = (a, n) => (Array.isArray(a) ? a.slice(0, n) : a);
  obj.destacados = trim(obj.destacados, 6);
  obj.faqs = trim(obj.faqs, 6);
  obj.keywordsObjetivo = trim(obj.keywordsObjetivo, 8);
  if (!Array.isArray(obj.destacados) || obj.destacados.length < 3) return "destacados < 3";
  if (!Array.isArray(obj.faqs) || obj.faqs.length < 3) return "faqs < 3";
  for (const f of obj.faqs) if (!f || typeof f.pregunta !== "string" || typeof f.respuesta !== "string") return "faqs forma";
  if (!Array.isArray(obj.keywordsObjetivo) || obj.keywordsObjetivo.length < 3) return "keywords < 3";
  return null;
}

function topMarcas(prods, n = 6) {
  const m = new Map();
  for (const p of prods) { const b = (p.marca || "").trim(); if (b) m.set(b, (m.get(b) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
}

async function main() {
  await loadEnv();
  const args = { force: process.argv.includes("--force"), dryRun: process.argv.includes("--dry-run"), slug: (process.argv.find((a) => a.startsWith("--slug=")) || "").slice(7) };

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const apiKey = process.env.LLM_API_KEY || "";
  const apiStyle = resolveApiStyle(process.env.LLM_API_STYLE, baseUrl);
  if (!args.dryRun && !apiKey) { console.error("Falta LLM_API_KEY"); process.exit(1); }

  await mkdir(OUT_DIR, { recursive: true });
  const productos = JSON.parse(await readFile(PRODUCTOS, "utf8")).productos;
  const { categorias } = JSON.parse(await readFile(CATEGORIAS, "utf8"));
  const promptText = await readFile(PROMPT_FILE, "utf8");
  const humanize = await readFile(HUMANIZE_FILE, "utf8").catch(() => "");
  const system = buildSystem(promptText, humanize);

  // Construir lista de categorías + subcategorías con productos.
  const entradas = [];
  for (const cat of categorias) {
    const prods = productos.filter((p) => p.categoria === cat.slug);
    entradas.push({
      slug: cat.slug, nombre: cat.nombre, esSubcategoria: false, categoriaPadre: null,
      totalProductos: prods.length,
      subcategorias: (cat.subcategorias || []).map((s) => s.nombre),
      marcasTop: topMarcas(prods), prods,
    });
    for (const sub of cat.subcategorias || []) {
      const sp = productos.filter((p) => p.subcategoria === sub.slug);
      if (sp.length) entradas.push({
        slug: sub.slug, nombre: sub.nombre, esSubcategoria: true, categoriaPadre: cat.nombre,
        totalProductos: sp.length, subcategorias: [], marcasTop: topMarcas(sp), prods: sp,
      });
    }
  }

  const lista = args.slug ? entradas.filter((e) => e.slug === args.slug) : entradas;
  console.error(`[categoria-seo] ${lista.length} categorías | model=${model} style=${apiStyle} force=${args.force}${args.dryRun ? " DRY" : ""}`);

  let ok = 0, skip = 0, err = 0;
  for (const e of lista) {
    const target = path.join(OUT_DIR, `${e.slug}.json`);
    if (!args.force && (await access(target).then(() => true).catch(() => false))) { skip++; console.error(`· ${e.slug}`); continue; }
    const precios = e.prods.map((p) => p.precio).filter((n) => n > 0);
    const payload = {
      slug: e.slug, nombre: e.nombre, esSubcategoria: e.esSubcategoria, categoriaPadre: e.categoriaPadre,
      totalProductos: e.totalProductos, subcategorias: e.subcategorias, marcasTop: e.marcasTop,
      precioMin: precios.length ? Math.min(...precios) : null, precioMax: precios.length ? Math.max(...precios) : null,
    };
    const user = JSON.stringify(payload, null, 2) + "\n\nGenera el JSON siguiendo el esquema. Solo el JSON.";
    if (args.dryRun) { console.error(`~ ${e.slug}\n`, user); ok++; continue; }
    try {
      const content = await callLlm({ system, user, baseUrl, apiKey, model, apiStyle });
      const obj = extractJson(content);
      const v = validate(obj, e.slug);
      if (v) throw new Error(v);
      await writeFile(target, JSON.stringify(obj, null, 2) + "\n", "utf8");
      ok++; console.error(`✓ ${e.slug}`);
    } catch (ex) { err++; console.error(`✗ ${e.slug}: ${ex.message}`); }
  }
  console.error(`\n[categoria-seo] ok=${ok} skip=${skip} err=${err}`);
  if (err) process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
