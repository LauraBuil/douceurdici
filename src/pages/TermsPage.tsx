import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { useDocumentTitle } from "../lib/formatters";

export function TermsPage() {
  useDocumentTitle("Conditions générales de vente");
  return (
    <>
      <Header />
      <main className="legal-page">
        <header className="legal-heading">
          <span className="eyebrow">Vente en ligne</span>
          <h1>Conditions générales de vente</h1>
          <p>Version destinée à la vente aux particuliers en France.</p>
        </header>
        <div className="legal-content legal-content--wide">
          <section><h2>1. Vendeur</h2><p>Douceur d’ici est exploité par Clara Tetart, micro-entrepreneuse, SIRET 827 536 749 00027, 1 rue des Pyrénées, 65200 Trébons. Contact : <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a>.</p></section>
          <section><h2>2. Produits</h2><p>Les produits sont fabriqués artisanalement. De légères variations d’aspect peuvent exister entre deux créations. Les informations essentielles, le prix et la disponibilité sont présentés sur chaque fiche produit.</p></section>
          <section><h2>3. Prix et paiement</h2><p>Les prix sont indiqués en euros. Les frais de livraison sont affichés avant le paiement. Le paiement est réalisé de manière sécurisée par Stripe. La validation de la commande implique une obligation de paiement.</p></section>
          <section><h2>4. Commandes et précommandes</h2><p>Une commande portant sur un produit en précommande est fabriquée avant son expédition. Les produits en stock et les précommandes sont identifiés sur le site. À partir de 20 pièces identiques, un délai spécifique est communiqué au client avant le paiement.</p></section>
          <section><h2>5. Livraison</h2><p>Les livraisons sont effectuées en France uniquement. Le délai habituel est de 2 à 5 jours ouvrés après la commande, fabrication et expédition comprises. En cas de commande d’au moins 20 pièces identiques, le délai convenu avec le client s’applique.</p><p>L’adresse fournie par le client doit être exacte. Une erreur d’adresse pouvant entraîner une nouvelle expédition peut donner lieu à des frais supplémentaires.</p></section>
          <section><h2>6. Rétractation et retours</h2><p>Le consommateur dispose en principe d’un délai de 14 jours à compter de la réception pour exercer son droit de rétractation. Les produits doivent être retournés à l’adresse suivante : 1 rue des Pyrénées, 65200 Trébons.</p><p>Les frais de retour sont à la charge du client, sauf produit non conforme ou erreur de Douceur d’ici. Les exceptions légales, notamment pour les produits personnalisés ou certains produits scellés ne pouvant être retournés pour des raisons d’hygiène après ouverture, s’appliquent.</p></section>
          <section><h2>7. Garanties</h2><p>Le client bénéficie des garanties légales applicables, notamment la garantie légale de conformité et la garantie des vices cachés.</p></section>
          <section><h2>8. Réclamation et médiation</h2><p>Pour toute réclamation, le client peut écrire à <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a>. Le médiateur de la consommation désigné est la CM2C. Ses coordonnées seront ajoutées dès réception des informations d’adhésion.</p></section>
          <section><h2>9. Données personnelles</h2><p>Les données nécessaires à la commande sont traitées conformément à la <a href="/confidentialite">politique de confidentialité</a>.</p></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
