export type AdminView =
  | "overview"
  | "products"
  | "orders"
  | "gallery"
  | "markets"
  | "settings";

export type ProductVariantDraft = {
  colorId: string | null;
  fragranceId: string | null;
  stock: number;
};
