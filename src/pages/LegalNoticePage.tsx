import { useDocumentTitle } from "../lib/formatters";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
export function LegalNoticePage() {
  useDocumentTitle("Mentions légales");
  return (
    <>
      <Header />
      <main className="legal-page">
        <header className="legal-heading">
          <span className="eyebrow">Informations légales</span>
          <h1>Mentions légales</h1>
          <p>
            Informations relatives à l’édition et au fonctionnement du site
            douceurdici.com.
          </p>
        </header>
        <div className="legal-layout">
          <aside>
            <p>Dernière mise à jour</p>
            <strong>14 septembre 2026</strong>
            <a href="mailto:douceurdici@protonmail.com">Nous contacter</a>
          </aside>
          <div className="legal-content">
            <section>
              <h2>1. Éditeur du site</h2>
              <p>
                Le site <strong>douceurdici.com</strong> est édité par Clara
                Tetart, entrepreneur individuel (EI), exerçant sous le nom commercial Douceur d’ici.
              </p>
              <p>
                SIRET : 827 536 749 00027.
              </p>
              <p>
                Activité : fabrication de bougies artisanales.
              </p>
              <p>
                Adresse électronique :{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
              </p>
              <p>Adresse professionnelle : 1 rue des Pyrénées, 65200 Trébons.</p>
            </section>
            <section>
              <h2>2. Direction de la publication</h2>
              <p>
                La directrice de la publication est Clara Tetart, entrepreneur individuel exploitant Douceur d’ici.
              </p>
            </section>
            <section>
              <h2>3. Conception et développement du site</h2>
              <p>
                Conception et développement : Laura Buil, développeuse et conceptrice du site.
              </p>
            </section>
            <section>
              <h2>4. Hébergement</h2>
              <p>
                Le site est hébergé par{" "}
                <strong>Hostinger International Limited</strong>, société privée
                à responsabilité limitée de droit chypriote, 61 Lordou Vironos
                Street, 6023 Larnaca, Chypre.
              </p>
              <p>
                <a
                  href="https://www.hostinger.fr/"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.hostinger.fr
                </a>
              </p>
            </section>
            <section>
              <h2>5. Propriété intellectuelle</h2>
              <p>
                Les textes, photographies, illustrations, éléments graphiques,
                logos et créations présentés sur ce site sont protégés par le
                droit de la propriété intellectuelle. Sauf autorisation écrite
                préalable, toute reproduction, représentation, adaptation ou
                exploitation, totale ou partielle, est interdite.
              </p>
            </section>
            <section>
              <h2>6. Responsabilité</h2>
              <p>
                Douceur d’ici veille à fournir des informations aussi exactes et
                à jour que possible. Ces informations sont données à titre
                indicatif et peuvent évoluer. Douceur d’ici ne peut garantir
                l’absence d’erreur ou l’accès continu au site.
              </p>
            </section>
            <section>
              <h2>7. Données personnelles</h2>
              <p>
                Les données collectées lors d’une commande sont utilisées pour
                préparer, livrer et suivre la commande, envoyer les emails de
                confirmation et répondre aux obligations comptables. Les
                paiements sont traités par Stripe : Douceur d’ici ne conserve
                pas les coordonnées bancaires.
              </p>
              <p>
                Pour toute question ou pour exercer vos droits d’accès, de
                rectification, d’effacement, de limitation ou d’opposition,
                écrivez à{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
                .
              </p>
            </section>
            <section>
              <h2>8. Cookies et stockage local</h2>
              <p>
                Le site public ne dépose pas de cookies publicitaires ou de
                mesure d’audience. L’espace d’administration utilise uniquement
                les mécanismes techniques nécessaires à l’authentification et à
                la sécurité de la session.
              </p>
            </section>
            <section>
              <h2>9. Liens externes</h2>
              <p>
                Le site peut contenir des liens vers des services tiers. Douceur
                d’ici n’exerce aucun contrôle sur leur contenu ni sur leurs
                pratiques de confidentialité.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
