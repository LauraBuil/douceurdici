import { useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { Footer } from "../components/site/Footer";
import { Header } from "../components/site/Header";
import { formatPrice } from "../data";
import { useDocumentTitle } from "../lib/formatters";
import { supabase } from "../lib/supabase";

type HistoryOrder = {
  id: string;
  status: string;
  subtotal: number;
  shipping_amount: number;
  total: number;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    is_preorder: boolean;
    color_name: string | null;
    fragrance_name: string | null;
  }>;
};

export function OrderHistoryPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useDocumentTitle("Mes commandes");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: requestError } = await supabase!.functions.invoke("request-order-access", { body: { email } });
    setLoading(false);
    if (requestError) setError("Le code n’a pas pu être envoyé. Réessayez dans quelques instants.");
    else setCodeSent(true);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: verifyError } = await supabase!.functions.invoke("verify-order-access", { body: { email, code } });
    setLoading(false);
    if (verifyError) {
      setError("Ce code est invalide ou expiré.");
      return;
    }
    setOrders((data?.orders ?? []) as HistoryOrder[]);
  }

  return (
    <>
      <Header />
      <main className="order-history-page">
        <header className="page-heading">
          <span className="eyebrow">Votre espace</span>
          <h1>Mes commandes</h1>
          <p>Consultez votre historique sans créer de compte.</p>
        </header>
        {orders === null ? (
          <section className="history-access-panel">
            <KeyRound aria-hidden="true" />
            <h2>{codeSent ? "Entrez votre code" : "Recevoir un code d’accès"}</h2>
            <p>
              {codeSent
                ? "Un code à 6 chiffres vient de vous être envoyé par email."
                : "Saisissez l’adresse utilisée lors de vos commandes."}
            </p>
            {!codeSent ? (
              <form onSubmit={requestCode}>
                <label>
                  Adresse email
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <button className="button button--dark" type="submit" disabled={loading}>
                  {loading ? "Envoi…" : "Recevoir mon code"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode}>
                <label>
                  Code reçu par email
                  <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} />
                </label>
                <button className="button button--dark" type="submit" disabled={loading}>
                  {loading ? <><LoaderCircle className="spin" /> Vérification…</> : "Voir mes commandes"}
                </button>
                <button className="button button--light" type="button" onClick={() => setCodeSent(false)}>
                  Modifier l’adresse email
                </button>
              </form>
            )}
            {error && <p className="form-error">{error}</p>}
          </section>
        ) : (
          <section className="history-list">
            {!orders.length && <div className="empty-state"><h2>Aucune commande trouvée.</h2><p>Cette adresse email ne contient pas encore de commande payée.</p></div>}
            {orders.map((order) => (
              <article className="history-order" key={order.id}>
                <header>
                  <div>
                    <span className="eyebrow">Commande #{order.id.slice(0, 8)}</span>
                    <h2>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(order.created_at))}</h2>
                  </div>
                  <span className="status status--published">{order.status === "fulfilled" ? "Préparée" : "Payée"}</span>
                </header>
                <ul>
                  {order.order_items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      <span>{item.quantity} × {item.product_name}{item.color_name ? ` · ${item.color_name}` : ""}{item.fragrance_name ? ` · ${item.fragrance_name}` : ""}{item.is_preorder ? " · Précommande" : ""}</span>
                      <strong>{formatPrice(Number(item.unit_price) * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <footer><span>Total</span><strong>{formatPrice(Number(order.total))}</strong></footer>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
