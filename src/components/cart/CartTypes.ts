import type { CatalogColor, Product } from "../../data";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  priceVisible: boolean;
  quantity: number;
  maxQuantity: number;
  isPreorder: boolean;
  imageUrl: string;
  variantId: string | null;
  color: Pick<CatalogColor, "id" | "name" | "hex_code"> | null;
  fragrance: { id: string; name: string } | null;
};

export type AddToCartInput = {
  product: Product;
  quantity: number;
  color?: CatalogColor | null;
  fragrance?: { id: string; name: string } | null;
  variantId?: string | null;
};
