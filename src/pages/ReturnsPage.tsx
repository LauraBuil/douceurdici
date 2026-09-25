import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { useDocumentTitle } from "../lib/formatters";

export function ReturnsPage() {
  useDocumentTitle("Retours et rétractation");
  return (
    <>
      <Header />
      <main className="legal-page">
        <header className="legal-heading"><span className="eyebrow">Après votre commande</span><h1>Retours et rétractation</h1><p>Les informations utiles pour retourner un produit.</p></header>
        <div className="legal-content legal-content--wide">
          <section><h2>Délai de rétractation</h2><p>Vous disposez en principe de 14 jours à compter de la réception pour nous informer de votre décision de vous rétracter. Écrivez à <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a> en indiquant votre numéro de commande.</p></section>
          <section><h2>Retour du produit</h2><p>Après votre demande, le produit doit être retourné sans retard excessif à : 1 rue des Pyrénées, 65200 Trébons. Les frais de retour sont à la charge du client, sauf erreur de Douceur d’ici ou produit non conforme.</p></section>
          <section><h2>Remboursement</h2><p>Le remboursement intervient selon les règles applicables après réception et vérification du produit retourné.</p></section>
          <section><h2>Exceptions</h2><p>Le droit de rétractation peut ne pas s’appliquer aux produits personnalisés ou à certains produits scellés ne pouvant être retournés pour des raisons d’hygiène après ouverture, conformément aux exceptions légales.</p></section>
          <section><h2>Produit non conforme</h2><p>Pour signaler un défaut ou une erreur, contactez-nous rapidement par email avec votre numéro de commande et des photographies si nécessaire.</p></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
