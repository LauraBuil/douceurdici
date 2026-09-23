import { Leaf } from "lucide-react";
import { useDocumentTitle } from "../lib/formatters";
import { navigate } from "../lib/navigation";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
export function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <>
      <Header />
      <main className="not-found">
        <Leaf />
        <span className="eyebrow">Erreur 404</span>
        <h1>Cette page n’existe pas.</h1>
        <p>
          La création ou la page que vous cherchez a peut-être été déplacée.
        </p>
        <button className="button button--dark" onClick={() => navigate("/")}>
          Retour à l’accueil
        </button>
      </main>
      <Footer />
    </>
  );
}
