import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";
import config from "@/data/config.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} | Papelería y útiles escolares en Bogotá`,
    short_name: SITE_NAME,
    description: config.descripcion,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    lang: "es-CO",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  };
}
