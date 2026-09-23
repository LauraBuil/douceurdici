import type { CartItem } from "../components/cart/CartTypes";
import { supabase } from "./supabase";

export type OrderReservation = {
  order_id: string;
  status: "reserved";
  subtotal: number;
  reservation_expires_at: string;
};

export type ShippingAddress = {
  fullName: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
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

export async function createCheckoutSession(
  items: CartItem[],
  customerEmail: string,
  customerName: string,
  shippingAddress: ShippingAddress,
  appUrl: string,
) {
  if (!supabase) {
    throw new Error("La connexion à la boutique est indisponible.");
  }

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      items: items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        color_id: item.color?.id ?? null,
        color_name: item.color?.name ?? null,
        color_hex_code: item.color?.hex_code ?? null,
        variant_id: item.variantId,
        fragrance_id: item.fragrance?.id ?? null,
        fragrance_name: item.fragrance?.name ?? null,
      })),
      customerEmail,
      customerName,
      shippingAddress,
      appUrl,
    },
  });

  if (error) throw error;
  if (!data?.checkout_url) {
    throw new Error("La page de paiement n’a pas pu être créée.");
  }

  return data as { checkout_url: string; order_id: string };
}
