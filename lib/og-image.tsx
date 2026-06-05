import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = `${SITE_NAME} — Papelería y útiles escolares a domicilio en Bogotá`;
export const OG_CONTENT_TYPE = "image/png";

/** Genera la imagen de compartir (OG/Twitter): ilustración IA de fondo + tarjeta con logo y nombre. */
export async function renderOgImage() {
  const bg = await readFile(path.join(process.cwd(), "public", "og", "og-bg.jpg"));
  const bgSrc = `data:image/jpeg;base64,${bg.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%" }}>
        {/* Fondo IA */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgSrc}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Velo para legibilidad */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(79,70,229,0.18)" }} />

        {/* Tarjeta central */}
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 40,
              padding: "52px 72px",
              boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
            }}
          >
            {/* Squircle "ue" */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 110,
                height: 110,
                borderRadius: 30,
                backgroundImage: "linear-gradient(135deg, #6366f1, #7c3aed)",
              }}
            >
              <span style={{ fontSize: 64, fontWeight: 800, color: "#ffffff", letterSpacing: -3 }}>ue</span>
            </div>

            <div style={{ display: "flex", marginTop: 28 }}>
              <span style={{ fontSize: 70, fontWeight: 800, color: "#0f172a", letterSpacing: -2 }}>Útiles</span>
              <span style={{ fontSize: 70, fontWeight: 800, color: "#4f46e5", letterSpacing: -2 }}>Escolares</span>
            </div>

            <span style={{ marginTop: 14, fontSize: 30, color: "#475569" }}>
              Papelería, útiles y todo para el cole
            </span>

            <div
              style={{
                display: "flex",
                marginTop: 26,
                padding: "10px 26px",
                borderRadius: 999,
                backgroundColor: "#f59e0b",
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 700, color: "#1f1300" }}>Entrega a domicilio en Bogotá</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
