import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { getNavSubcategorias } from "@/lib/productos";
import config from "@/data/config.json";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Papelería y útiles escolares a domicilio en Bogotá`,
    template: `%s | ${SITE_NAME} Bogotá`,
  },
  description: config.descripcion,
  keywords: [
    "útiles escolares Bogotá",
    "papelería Bogotá",
    "lista escolar",
    "cuadernos",
    "esferos",
    "morrales",
    "artículos de fiesta",
    "papelería a domicilio",
    "regreso a clases",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} | Papelería y útiles escolares en Bogotá`,
    description: config.descripcion,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Papelería y útiles escolares en Bogotá`,
    description: config.descripcion,
  },
  robots: { index: true, follow: true },
};

const storeLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${SITE_URL}/#store`,
  inLanguage: "es-CO",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: config.descripcion,
  slogan: config.tagline,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bogotá",
    addressRegion: "Bogotá D.C.",
    addressCountry: "CO",
  },
  areaServed: { "@type": "City", name: "Bogotá" },
  priceRange: "$$",
  currenciesAccepted: "COP",
  paymentAccepted: "Efectivo, Transferencia bancaria, Tarjeta",
  telephone: `+57${config.whatsapp}`,
  email: config.email,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "19:00",
    },
  ],
  sameAs: [`https://instagram.com/${config.instagram}`],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const navSubs = getNavSubcategorias();
  return (
    <html lang="es" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <JsonLd data={storeLd} />
        <CartProvider>
          <Header navSubs={navSubs} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
