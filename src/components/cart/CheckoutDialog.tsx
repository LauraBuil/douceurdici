import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { CartItem } from "./CartTypes";
import { createCheckoutSession } from "../../lib/orders";

type CheckoutDialogProps = {
  items: CartItem[];
  onClose: () => void;
};

export function CheckoutDialog({ items, onClose }: CheckoutDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { checkout_url: checkoutUrl } = await createCheckoutSession(
        items,
        email,
        name,
      );
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Le paiement n’a pas pu être préparé.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="editor-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onClose();
    }}>
      <section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <header>
          <div>
            <span className="eyebrow">Dernière étape</span>
            <h2 id="checkout-title">Vos coordonnées</h2>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Fermer">
            <X />
          </button>
        </header>
        <p>
          Indiquez votre adresse email pour recevoir la confirmation de commande.
        </p>
        <form onSubmit={submit}>
          <label>
            Nom et prénom
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </label>
          <label>
            Adresse email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button--dark" type="submit" disabled={loading}>
            {loading ? "Préparation du paiement…" : "Continuer vers le paiement"}
          </button>
        </form>
      </section>
    </div>
  );
}
