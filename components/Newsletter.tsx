"use client";

import { useState } from "react";

/** Suscripción al boletín (placeholder: guarda el correo en localStorage). */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;
    try {
      const raw = localStorage.getItem("ue_newsletter");
      const prev = raw ? (JSON.parse(raw) as string[]) : [];
      if (!prev.includes(val)) localStorage.setItem("ue_newsletter", JSON.stringify([val, ...prev]));
    } catch {
      /* ignoramos errores de persistencia */
    }
    setOk(true);
    setEmail("");
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">No te pierdas nada</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-white text-balance sm:text-3xl">
            Recibe ofertas y novedades para el regreso a clases
          </h2>
          {ok ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 font-semibold text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ¡Listo! Te avisaremos de las novedades.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                aria-label="Tu correo electrónico"
                className="w-full flex-1 rounded-full border-0 bg-white px-5 py-3 text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-white/60"
              />
              <button type="submit" className="btn-accent shrink-0">Suscribirme</button>
            </form>
          )}
          <p className="mt-3 text-xs text-white/60">Solo te escribimos para ofertas y temporada escolar. Sin spam.</p>
        </div>
      </div>
    </section>
  );
}
