/**
 * Guard de idioma: regla IRROMPIBLE de que todo el contenido generado debe estar
 * en español. Detecta texto en otro idioma (sobre todo inglés) contando palabras
 * funcionales inglesas que no existen en español. Si aparecen >= UMBRAL distintas,
 * se considera "no español" y el generador debe RECHAZAR y volver a generar.
 *
 * Es heurístico a propósito (sin API): tolera préstamos sueltos comunes en
 * papelería (sticker, topper, kit, set, happy, birthday, deluxe, neon, gel…)
 * porque solo cuenta palabras FUNCIONALES (the, and, with, for, your, this…),
 * que solo aparecen juntas en frases realmente en inglés.
 */

// Palabras funcionales inglesas que no existen en español (señal fuerte de inglés).
const EN_WORDS = new Set([
  "the", "and", "with", "for", "your", "you", "are", "was", "were", "will",
  "would", "this", "that", "these", "those", "our", "their", "from", "what",
  "when", "where", "which", "while", "because", "however", "therefore", "they",
  "them", "there", "than", "then", "into", "about", "over", "also", "very",
  "just", "only", "more", "most", "each", "every", "other", "some", "such",
  "been", "being", "does", "should", "could", "shall", "here", "have", "has",
  "make", "made", "best", "buy", "cheap", "free", "shipping", "discount",
]);

// Palabras portuguesas (sin tilde) que no existen en español. El portugués con
// tildes (não, você, coração…) ya cae por los caracteres ã/õ/ç de abajo.
const PT_WORDS = new Set([
  "nao", "voce", "voces", "com", "uma", "umas", "muito", "muitos", "tambem",
  "entao", "isso", "mais", "voce", "obrigado", "obrigada", "estao", "sao",
  "nos", "seu", "sua", "aqui",
]);

const UMBRAL_EN = 3; // palabras inglesas DISTINTAS para marcar no-español
const UMBRAL_PT = 2; // palabras portuguesas DISTINTAS

// Alfabetos no latinos (chino/japonés/coreano/cirílico/árabe/griego/hebreo/tailandés).
const NO_LATINO =
  /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿가-힯Ѐ-ӿ؀-ۿͰ-Ͽ֐-׿฀-๿＀-￯]/;
// Caracteres propios del portugués (no existen en español): ã õ ç.
const PT_CHARS = /[ãõçÃÕÇ]/;

/**
 * Devuelve un MOTIVO (string) si el texto NO está en español, o null si está bien.
 */
export function detectarNoEspanol(text) {
  const s = String(text || "");
  if (NO_LATINO.test(s)) {
    const ch = s.match(NO_LATINO)[0];
    return `alfabeto no latino (p. ej. chino/japonés): "${ch}"`;
  }
  if (PT_CHARS.test(s)) {
    return `caracteres de portugués (ã/õ/ç): "${s.match(PT_CHARS)[0]}"`;
  }
  const tokens = s.toLowerCase().split(/[^a-zñáéíóúü]+/);
  const en = new Set();
  const pt = new Set();
  for (const t of tokens) {
    if (EN_WORDS.has(t)) en.add(t);
    if (PT_WORDS.has(t)) pt.add(t);
  }
  if (pt.size >= UMBRAL_PT) return `palabras en portugués: ${[...pt].join(", ")}`;
  if (en.size >= UMBRAL_EN) return `palabras en inglés: ${[...en].join(", ")}`;
  return null;
}

/**
 * Lanza un error si alguno de los textos no está en español. El generador debe
 * dejar que el error propague para reintentar (rechazar y volver a hacer).
 */
export function assertEspanol(fields) {
  const text = (Array.isArray(fields) ? fields : [fields])
    .flat(Infinity)
    .filter((x) => typeof x === "string")
    .join("\n");
  const motivo = detectarNoEspanol(text);
  if (motivo) {
    throw new Error(`Idioma no español detectado (${motivo}). Rechazado: regenerar en español.`);
  }
}

// Auto-test: `node scripts/lib/es-guard.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  const casos = {
    "ES (pasa)": "Compra cuadernos y esferos en Bogotá. Entrega a domicilio por WhatsApp. Incluye stickers y un topper Happy Birthday.",
    "EN (rechaza)": "Buy the best school supplies for your kids with free shipping and great discounts.",
    "ZH (rechaza)": "购买最好的学习用品，免费送货到波哥大。",
    "PT con tildes (rechaza)": "Compre os melhores materiais escolares com entrega em Bogotá. Não perca!",
    "PT sin tildes (rechaza)": "Compre uma caneta com entrega rapida, muito boa, tambem para voce.",
  };
  for (const [n, t] of Object.entries(casos)) console.log(n + ":", detectarNoEspanol(t) ?? "OK ✓");
}
