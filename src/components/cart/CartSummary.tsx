import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "../../data";
import type { CartItem } from "./CartTypes";
import { CheckoutDialog } from "./CheckoutDialog";

export function CartSummary({ subtotal, items }: { subtotal: number; items: CartItem[] }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      <aside className="cart-summary">
        <span className="eyebrow">Récapitulatif</span>
        <h2>Votre commande</h2>
        <div className="cart-summary-line">
          <span>Sous-total</span>
          <strong>{formatPrice(subtotal)}</strong>
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
