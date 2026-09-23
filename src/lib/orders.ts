import type { CartItem } from "../components/cart/CartTypes";
import { supabase } from "./supabase";

export type OrderReservation = {
  order_id: string;
  status: "reserved";
  subtotal: number;
  reservation_expires_at: string;
};

export async function createOrderReservation(items: CartItem[]) {
  if (!supabase) {
    throw new Error("La connexion à la boutique est indisponible.");
  }

  const { data, error } = await supabase.rpc("create_order_reservation", {
    p_items: items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      color_id: item.color?.id ?? null,
      color_name: item.color?.name ?? null,
      color_hex_code: item.color?.hex_code ?? null,
      variant_id: item.variantId,
      fragrance_id: item.fragrance?.id ?? null,
      fragrance_name: item.fragrance?.name ?? null,
    })),
  });

  if (error) throw error;
  return data as OrderReservation;
}
