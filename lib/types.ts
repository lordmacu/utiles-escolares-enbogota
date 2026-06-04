/** Tipos compartidos del catálogo. */

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  marca: string;
  precio: number;
  precioAnterior: number | null;
  descripcion: string;
  imagen: string;
  galeria?: string[];
  contenido?: string[];
  tags: string[];
  popular: boolean;
  visible: boolean;
  stock: number;
  categoria: string;
  /** Slug de la subcategoría real (de VTEX), si aplica. */
  subcategoria?: string;
  /** Color inferido del nombre (faceta de filtro), si aplica. */
  color?: string;
}

/** Versión liviana para listados/búsqueda en cliente (menos bytes al navegador). */
export interface ProductoIndex {
  id: string;
  nombre: string;
  slug: string;
  marca: string;
  precio: number;
  precioAnterior: number | null;
  imagen: string;
  categoria: string;
  /** Slug de la categoría principal (para filtrar por categoría madre). */
  catPrincipal: string;
  /** Slug de la subcategoría real, si aplica. */
  subcategoria?: string;
  /** Color inferido (faceta de filtro), si aplica. */
  color?: string;
  popular: boolean;
}

/** Línea del carrito (persistida en localStorage). */
export interface CartItem {
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  categoria: string;
  cantidad: number;
}
