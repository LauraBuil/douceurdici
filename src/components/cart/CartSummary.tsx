import { ArrowRight } from "lucide-react";
import { formatPrice } from "../../data";

export function CartSummary({ subtotal }: { subtotal: number }) {
  return (
    <aside className="cart-summary">
      <span className="eyebrow">Récapitulatif</span>
      <h2>Votre commande</h2>
      <div className="cart-summary-line">
        <span>Sous-total</span>
        <strong>{formatPrice(subtotal)}</strong>
      </div>
      <p>Les frais de livraison seront calculés lors de la prochaine étape.</p>
      <button className="button button--dark" type="button" disabled>
        Passer à la commande <ArrowRight size={16} />
      </button>
      <small className="cart-checkout-note">
        Le paiement sera disponible prochainement.
      </small>
    </aside>
  );
}
