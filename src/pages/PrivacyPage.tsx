import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { useDocumentTitle } from "../lib/formatters";

export function PrivacyPage() {
  useDocumentTitle("Politique de confidentialité");
  return (
    <>
      <Header />
      <main className="legal-page">
        <header className="legal-heading"><span className="eyebrow">Données personnelles</span><h1>Politique de confidentialité</h1><p>Comment les données nécessaires au site et aux commandes sont utilisées.</p></header>
        <div className="legal-content legal-content--wide">
          <section><h2>Responsable du traitement</h2><p>Clara Tetart, micro-entrepreneuse, 1 rue des Pyrénées, 65200 Trébons. Contact : <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a>.</p></section>
          <section><h2>Données collectées</h2><p>Lors d’une commande, nous collectons le nom, l’adresse email et l’adresse de livraison. Ces données sont nécessaires à la préparation, au paiement, à la livraison, au service client et à la conservation des documents comptables.</p></section>
          <section><h2>Prestataires</h2><p>Stripe traite le paiement, Resend l’envoi des emails transactionnels, Supabase le stockage applicatif et Hostinger l’hébergement du site. Les données bancaires ne sont pas conservées par Douceur d’ici.</p></section>
          <section><h2>Durée de conservation</h2><p>Les données de commande sont conservées pendant la durée nécessaire à la relation commerciale et aux obligations légales, notamment comptables. Les codes d’accès à l’historique sont temporaires et expirent après quelques minutes.</p></section>
          <section><h2>Vos droits</h2><p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou l’opposition au traitement de vos données en écrivant à <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a>.</p></section>
          <section><h2>Cookies et stockage local</h2><p>Le panier et les préférences nécessaires au fonctionnement du site peuvent être conservés localement. Aucun cookie publicitaire ou outil de mesure d’audience n’est utilisé actuellement.</p></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
