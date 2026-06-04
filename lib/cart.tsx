"use client";

/**
 * Carrito de compra del lado del cliente.
 * - Estado con useReducer, persistido en localStorage (`ue_carrito`).
 * - Al hacer checkout se guarda el pedido en localStorage (`ue_pedidos`) — por
 *   ahora es un placeholder (no hay pasarela de pago ni backend).
 * - Maneja también el estado del drawer (panel lateral) del carrito.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "ue_carrito";
const ORDERS_KEY = "ue_pedidos";

type AddPayload = Omit<CartItem, "cantidad"> & { cantidad?: number };

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: AddPayload }
  | { type: "remove"; slug: string }
  | { type: "setQty"; slug: string; cantidad: number }
  | { type: "clear" };

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return Array.isArray(action.items) ? action.items : state;
    case "add": {
      const qty = Math.max(1, action.item.cantidad ?? 1);
      const existing = state.find((i) => i.slug === action.item.slug);
      if (existing) {
        return state.map((i) =>
          i.slug === action.item.slug ? { ...i, cantidad: i.cantidad + qty } : i
        );
      }
      const { cantidad: _omit, ...rest } = action.item;
      return [...state, { ...rest, cantidad: qty }];
    }
    case "remove":
      return state.filter((i) => i.slug !== action.slug);
    case "setQty":
      if (action.cantidad <= 0) return state.filter((i) => i.slug !== action.slug);
      return state.map((i) =>
        i.slug === action.slug ? { ...i, cantidad: action.cantidad } : i
      );
    case "clear":
      return [];
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: AddPayload) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, cantidad: number) => void;
  clear: () => void;
  /** Guarda el pedido en localStorage y vacía el carrito. Devuelve el id del pedido. */
  checkout: (datos?: { nombre?: string; telefono?: string; nota?: string }) => string;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Hidratar desde localStorage al montar (evita mismatch de SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) as CartItem[] });
    } catch {
      /* localStorage inaccesible o corrupto: arrancamos vacío */
    }
    setReady(true);
  }, []);

  // Persistir en cada cambio (después de hidratar).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* sin espacio o sin permiso: ignoramos */
    }
  }, [items, ready]);

  const add = useCallback((item: AddPayload) => {
    dispatch({ type: "add", item });
    setIsOpen(true);
  }, []);
  const remove = useCallback((slug: string) => dispatch({ type: "remove", slug }), []);
  const setQty = useCallback(
    (slug: string, cantidad: number) => dispatch({ type: "setQty", slug, cantidad }),
    []
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const checkout = useCallback(
    (datos?: { nombre?: string; telefono?: string; nota?: string }) => {
      const id = `PED-${Date.now().toString(36).toUpperCase()}`;
      const pedido = {
        id,
        fecha: new Date().toISOString(),
        items,
        total: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
        cliente: datos ?? {},
      };
      try {
        const raw = localStorage.getItem(ORDERS_KEY);
        const prev = raw ? (JSON.parse(raw) as unknown[]) : [];
        localStorage.setItem(ORDERS_KEY, JSON.stringify([pedido, ...prev]));
      } catch {
        /* ignoramos errores de persistencia */
      }
      dispatch({ type: "clear" });
      setIsOpen(false);
      return id;
    },
    [items]
  );

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.cantidad, 0);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    return {
      items,
      count,
      total,
      add,
      remove,
      setQty,
      clear,
      checkout,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      ready,
    };
  }, [items, isOpen, ready, add, remove, setQty, clear, checkout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
