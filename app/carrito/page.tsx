import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisa los productos de tu carrito y confirma tu pedido por WhatsApp.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/carrito" },
};

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <CartView />
    </div>
  );
}
