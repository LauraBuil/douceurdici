import { Footer } from "../components/site/Footer";
import { Header } from "../components/site/Header";
import { useDocumentTitle } from "../lib/formatters";

export function PrivacyPage() {
  useDocumentTitle("Politique de confidentialité");

  return (
    <>
      <Header />
      <main className="legal-page">
        <header className="legal-heading">
          <span className="eyebrow">Données personnelles</span>
          <h1>Politique de confidentialité</h1>
          <p>
            Comment les données nécessaires au site et aux commandes sont
            utilisées.
          </p>
        </header>

        <div className="legal-layout">
          <aside>
            <p>Dernière mise à jour</p>
            <strong>25 septembre 2026</strong>
            <a href="mailto:douceurdici@protonmail.com">Nous contacter</a>
          </aside>

          <div className="legal-content">
            <section>
              <h2>1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement est Clara Tetart, entrepreneur individuel (EI),
                exerçant une activité de fabrication de bougies artisanales,
                située au 1 rue des Pyrénées, 65200 Trébons. Contact :{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2>2. Données collectées et finalités</h2>
              <p>
                Lors d’une commande, nous collectons le nom, l’adresse email,
                l’adresse de livraison, le contenu de la commande et les
                informations nécessaires à son suivi. Ces données servent à
                traiter la commande, organiser la livraison, envoyer les
                confirmations, répondre au service client et respecter les
                obligations comptables et légales.
              </p>
            </section>

            <section>
              <h2>3. Prestataires</h2>
              <p>
                Stripe traite le paiement, Resend envoie les emails
                transactionnels, Supabase héberge les données applicatives et
                Hostinger héberge le site. Les données bancaires ne sont pas
                conservées par Douceur d’ici. Les informations nécessaires peuvent
                être transmises au transporteur pour la livraison.
              </p>
            </section>

            <section>
              <h2>4. Conservation</h2>
              <p>
                Les données de commande sont conservées pendant la durée
                nécessaire à la relation commerciale et aux obligations légales,
                notamment comptables. Les codes d’accès à l’historique sont
                temporaires et expirent après quelques minutes.
              </p>
            </section>

            <section>
              <h2>5. Vos droits</h2>
              <p>
                Vous pouvez demander l’accès, la rectification, l’effacement,
                la limitation ou l’opposition au traitement de vos données, dans
                les conditions prévues par la réglementation, en écrivant à{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
                .
              </p>
              <p>
                Vous pouvez également adresser une réclamation à la Commission
                nationale de l’informatique et des libertés (CNIL).
              </p>
            </section>

            <section>
              <h2>6. Cookies et stockage local</h2>
              <p>
                Le panier et les préférences nécessaires au fonctionnement du
                site peuvent être conservés localement sur votre appareil. Aucun
                cookie publicitaire ni outil de mesure d’audience n’est utilisé
                actuellement.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
