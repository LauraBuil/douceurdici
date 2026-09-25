import { Footer } from "../components/site/Footer";
import { Header } from "../components/site/Header";
import { useDocumentTitle } from "../lib/formatters";

export function TermsPage() {
  useDocumentTitle("CGV, commandes et retours");

  return (
    <>
      <Header />
      <main className="legal-page">
        <header className="legal-heading">
          <span className="eyebrow">Vente en ligne</span>
          <h1>CGV, commandes et retours</h1>
          <p>
            Conditions de vente et informations pratiques pour les commandes
            des particuliers en France.
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
              <h2>1. Vendeur</h2>
              <p>
                Douceur d’ici est exploité par Clara Tetart, entrepreneur individuel (EI),
                exerçant une activité de fabrication de bougies artisanales,
                SIRET 827 536 749 00027, 1 rue des Pyrénées, 65200 Trébons.
                Contact :{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2>2. Produits et disponibilité</h2>
              <p>
                Les produits sont fabriqués artisanalement. De légères
                variations d’aspect peuvent exister entre deux créations. Les
                informations essentielles, le prix, les variantes disponibles et
                l’état du stock sont présentés sur chaque fiche produit.
              </p>
              <p>
                Un produit indiqué « précommande » est fabriqué avant son
                expédition. Le client est informé de ce délai supplémentaire
                avant de confirmer sa commande.
              </p>
            </section>

            <section>
              <h2>3. Commande et confirmation</h2>
              <p>
                Le client sélectionne les produits, les quantités et, lorsque
                cela est proposé, la couleur et le parfum. Avant le paiement,
                un récapitulatif présente les articles, l’adresse de livraison,
                les frais de livraison et le montant total à payer.
              </p>
              <p>
                La commande est confirmée après validation du paiement. Un email
                récapitulatif est alors envoyé au client et les informations de
                la commande sont conservées sur un support durable.
              </p>
            </section>

            <section>
              <h2>4. Prix et paiement</h2>
              <p>
                Les prix sont indiqués en euros, toutes taxes comprises lorsque
                la réglementation applicable le prévoit. Les frais de livraison
                sont affichés avant le paiement et compris dans le montant final.
                Le paiement est sécurisé et traité par Stripe. Douceur d’ici ne
                conserve pas les données bancaires.
              </p>
            </section>

            <section>
              <h2>5. Livraison</h2>
              <p>
                Les livraisons sont effectuées en France uniquement. Le délai
                habituel est de 2 à 5 jours ouvrés après la commande,
                fabrication et expédition comprises.
              </p>
              <p>
                Pour une commande d’au moins 20 pièces identiques ou une
                précommande, un délai supplémentaire peut être nécessaire. Le
                délai spécifique est communiqué au client lorsqu’il est connu.
                L’adresse fournie par le client doit être exacte. Une erreur
                d’adresse pouvant entraîner une nouvelle expédition peut donner
                lieu à des frais supplémentaires.
              </p>
            </section>

            <section>
              <h2>6. Droit de rétractation</h2>
              <p>
                Le consommateur dispose en principe d’un délai de 14 jours à
                compter de la réception pour informer Douceur d’ici de sa
                décision de se rétracter, sans avoir à justifier sa décision.
                La demande peut être envoyée à{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
                , en indiquant le numéro de commande.
              </p>
            </section>

            <section>
              <h2>7. Retours et remboursement</h2>
              <p>
                Après avoir exercé son droit de rétractation, le client renvoie
                le produit sans retard excessif à l’adresse suivante : 1 rue des
                Pyrénées, 65200 Trébons. Les frais directs de retour sont à la
                charge du client, sauf erreur de Douceur d’ici ou produit non
                conforme.
              </p>
              <p>
                Le remboursement intervient selon les règles applicables après
                réception du produit retourné, ou dès réception d’une preuve
                d’expédition lorsque celle-ci est exigée par la réglementation.
              </p>
            </section>

            <section>
              <h2>8. Exceptions et garanties</h2>
              <p>
                Le droit de rétractation peut ne pas s’appliquer aux produits
                confectionnés selon les spécifications du client ou nettement
                personnalisés, ainsi qu’aux produits scellés ne pouvant être
                retournés pour des raisons d’hygiène après ouverture, dans les
                conditions prévues par la loi.
              </p>
              <p>
                Le client bénéficie de la garantie légale de conformité et de la
                garantie des vices cachés. Pour signaler un défaut, une erreur
                ou une non-conformité, contactez-nous avec le numéro de commande
                et, si nécessaire, des photographies.
              </p>
            </section>

            <section>
              <h2>9. Réclamation et médiation</h2>
              <p>
                Pour toute question ou réclamation, le client peut écrire à{" "}
                <a href="mailto:douceurdici@protonmail.com">
                  douceurdici@protonmail.com
                </a>
                . En cas de litige non résolu, il peut recourir gratuitement au
                médiateur de la consommation désigné : CM2C. Les coordonnées du
                médiateur seront ajoutées dès réception des informations
                d’adhésion.
              </p>
            </section>

            <section>
              <h2>10. Données personnelles</h2>
              <p>
                Les données nécessaires à la commande sont traitées
                conformément à la{" "}
                <a href="/confidentialite">politique de confidentialité</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
