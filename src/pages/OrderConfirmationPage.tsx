import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Footer } from "../components/site/Footer";
import { Header } from "../components/site/Header";
import { useCart } from "../components/cart/useCart";
import { navigate } from "../lib/navigation";
import { useDocumentTitle } from "../lib/formatters";

export function OrderConfirmationPage() {
  const { clearCart } = useCart();
  const hasClearedCart = useRef(false);
  useDocumentTitle("Commande confirmée");

  useEffect(() => {
    if (!hasClearedCart.current) {
      hasClearedCart.current = true;
      clearCart();
    }
  }, [clearCart]);

  return (
    <>
      <Header />
      <main className="confirmation-page">
        <CheckCircle2 aria-hidden="true" />
        <span className="eyebrow">Merci pour votre confiance</span>
        <h1>Votre commande est confirmée.</h1>
        <p>
          Le paiement a bien été reçu. Vous recevrez la confirmation et les
          informations de livraison par email.
        </p>
        <button
          className="button button--dark"
          type="button"
          onClick={() => {
            navigate("/");
          }}
        >
          Retourner à la boutique
        </button>
      </main>
      <Footer />
    </>
  );
}
