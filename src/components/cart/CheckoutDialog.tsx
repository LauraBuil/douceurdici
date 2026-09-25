import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { AppLink } from "../site/AppLink";
import type { CartItem } from "./CartTypes";
import {
  createCheckoutSession,
  type ShippingAddress,
} from "../../lib/orders";

type CheckoutDialogProps = {
  items: CartItem[];
  onClose: () => void;
};

export function CheckoutDialog({ items, onClose }: CheckoutDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    line1: "",
    line2: "",
    postalCode: "",
    city: "",
    country: "France",
  });
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions générales de vente.");
      return;
    }
    setLoading(true);

    try {
      const { checkout_url: checkoutUrl } = await createCheckoutSession(
        items,
        email,
        name,
        { ...shippingAddress, fullName: shippingAddress.fullName || name },
        `${window.location.origin}${window.location.pathname.startsWith("/dev") ? "/dev" : ""}`,
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
          Indiquez vos coordonnées pour recevoir la confirmation et être livré.
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
          <label>
            Nom du destinataire
            <input
              required
              value={shippingAddress.fullName}
              onChange={(event) =>
                setShippingAddress((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              autoComplete="shipping name"
              placeholder={name || "Nom et prénom"}
            />
          </label>
          <label>
            Adresse
            <input
              required
              value={shippingAddress.line1}
              onChange={(event) =>
                setShippingAddress((current) => ({
                  ...current,
                  line1: event.target.value,
                }))
              }
              autoComplete="shipping address-line1"
            />
          </label>
          <label>
            Complément d’adresse <small>(facultatif)</small>
            <input
              value={shippingAddress.line2}
              onChange={(event) =>
                setShippingAddress((current) => ({
                  ...current,
                  line2: event.target.value,
                }))
              }
              autoComplete="shipping address-line2"
            />
          </label>
          <div className="form-grid">
            <label>
              Code postal
              <input
                required
                value={shippingAddress.postalCode}
                onChange={(event) =>
                  setShippingAddress((current) => ({
                    ...current,
                    postalCode: event.target.value,
                  }))
                }
                autoComplete="shipping postal-code"
              />
            </label>
            <label>
              Ville
              <input
                required
                value={shippingAddress.city}
                onChange={(event) =>
                  setShippingAddress((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                autoComplete="shipping address-level2"
              />
            </label>
          </div>
          <label className="checkout-terms">
            <input
              required
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              J’accepte les <AppLink href="/cgv">conditions générales de vente</AppLink>.
            </span>
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
