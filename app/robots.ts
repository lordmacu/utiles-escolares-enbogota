import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawlers de motores de IA / LLMs bienvenidos (mejor visibilidad en respuestas
// generativas: ChatGPT, Claude, Perplexity, Google AI, etc.).
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "Google-CloudVertexBot",
  "Applebot-Extended",
  "Applebot",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "Meta-ExternalAgent",
  "FacebookBot",
  "cohere-ai",
  "DuckAssistBot",
  "PetalBot",
  "YouBot",
  "Diffbot",
  "Timpibot",
  "omgili",
  "Webzio-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/carrito" },
      { userAgent: AI_BOTS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
