import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "../../data";
import type { CartItem } from "./CartTypes";
import { CheckoutDialog } from "./CheckoutDialog";
import { supabase } from "../../lib/supabase";

export function CartSummary({ subtotal, items }: { subtotal: number; items: CartItem[] }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingRate, setShippingRate] = useState(0);

  useEffect(() => {
    supabase
      ?.from("site_settings")
      .select("numeric_value")
      .eq("id", "shipping_rate")
      .maybeSingle()
      .then(({ data }) => setShippingRate(Math.max(0, Number(data?.numeric_value ?? 0))));
  }, []);

  return (
    <>
      <aside className="cart-summary">
        <span className="eyebrow">Récapitulatif</span>
        <h2>Votre commande</h2>
        <div className="cart-summary-line">
          <span>Sous-total</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <div className="cart-summary-line">
          <span>Livraison</span>
          <strong>{shippingRate ? formatPrice(shippingRate) : "Gratuite"}</strong>
        </div>
        <div className="cart-summary-line">
          <span>Total</span>
          <strong>{formatPrice(subtotal + shippingRate)}</strong>
        </div>
        <p>Les frais de livraison seront calculés lors de la prochaine étape.</p>
        <button
          className="button button--dark"
          type="button"
          onClick={() => setIsCheckoutOpen(true)}
        >
          Passer à la commande <ArrowRight size={16} />
        </button>
        <small className="cart-checkout-note">
          Paiement sécurisé par Stripe.
        </small>
      </aside>
      {isCheckoutOpen && (
        <CheckoutDialog items={items} onClose={() => setIsCheckoutOpen(false)} />
      )}
    </>
  );
}
