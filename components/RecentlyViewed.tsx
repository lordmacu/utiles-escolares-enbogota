"use client";

import { useEffect, useState } from "react";
import { ProductCarousel } from "@/components/ProductCarousel";

export interface VistoItem {
  nombre: string;
  slug: string;
  marca?: string;
  precio: number;
  precioAnterior: number | null;
  imagen: string;
  categoria: string;
  popular?: boolean;
}

const KEY = "ue_vistos";
const MAX = 12;

/** Registra (side-effect) la vista de un producto en localStorage. No renderiza nada. */
export function RecordRecentView({ item }: { item: VistoItem }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const prev: VistoItem[] = raw ? JSON.parse(raw) : [];
      const next = [item, ...prev.filter((p) => p.slug !== item.slug)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignoramos errores de persistencia */
    }
  }, [item]);
  return null;
}

/** Muestra los productos vistos recientemente (excluye el actual). */
export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<VistoItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: VistoItem[] = raw ? JSON.parse(raw) : [];
      setItems(list.filter((p) => p.slug !== excludeSlug));
    } catch {
      setItems([]);
    }
  }, [excludeSlug]);

  if (items.length < 2) return null;

  return <ProductCarousel eyebrow="Tu historial" titulo="Vistos recientemente" productos={items} />;
}
