"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ZOOM = 2.5;
const LENS = 220; // diámetro del lente en px

/** Galería de producto: imagen principal con lupa al pasar el cursor + miniaturas. */
export function ProductGallery({
  imagen,
  galeria = [],
  alt,
  children,
}: {
  imagen: string;
  galeria?: string[];
  alt: string;
  children?: React.ReactNode;
}) {
  const imagenes = Array.from(new Set([imagen, ...galeria].filter(Boolean)));
  const [activa, setActiva] = useState(imagen || imagenes[0] || "");

  const marcoRef = useRef<HTMLDivElement>(null);
  const [canHover, setCanHover] = useState(false);
  const [lupa, setLupa] = useState({ visible: false, x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!canHover || !activa) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLupa({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    });
  }

  // Posiciona la copia ampliada para que el punto bajo el cursor quede en el centro del lente.
  const innerX = LENS / 2 - lupa.x * ZOOM;
  const innerY = LENS / 2 - lupa.y * ZOOM;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={marcoRef}
        onMouseEnter={onMove}
        onMouseMove={onMove}
        onMouseLeave={() => setLupa((l) => ({ ...l, visible: false }))}
        className={`relative aspect-square overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] ${
          canHover && activa ? "cursor-zoom-in" : ""
        }`}
      >
        {activa ? (
          <Image
            src={activa}
            alt={alt}
            fill
            priority
            className="object-contain p-6"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[var(--color-primary)]/30">
            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}

        {/* Lente de lupa */}
        {lupa.visible && activa && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-20 overflow-hidden rounded-full border-2 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-1 ring-black/10 bg-[var(--color-surface)]"
            style={{
              width: LENS,
              height: LENS,
              left: lupa.x - LENS / 2,
              top: lupa.y - LENS / 2,
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: lupa.w,
                height: lupa.h,
                transformOrigin: "0 0",
                transform: `translate(${innerX}px, ${innerY}px) scale(${ZOOM})`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activa} alt="" className="h-full w-full object-contain p-6" draggable={false} />
            </div>
          </div>
        )}

        {children}
      </div>

      {imagenes.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {imagenes.slice(0, 6).map((img) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiva(img)}
              aria-label="Ver imagen"
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-[var(--color-surface)] transition-colors ${
                activa === img ? "border-[var(--color-primary)]" : "border-[var(--color-line)] hover:border-[var(--color-primary)]/50"
              }`}
            >
              <Image src={img} alt={alt} fill className="object-contain p-1.5" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
