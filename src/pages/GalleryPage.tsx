import { useEffect, useState } from "react";
import { Image as ImageIcon, LoaderCircle } from "lucide-react";
import { type GalleryImage } from "../data";
import { supabase } from "../lib/supabase";
import { useDocumentTitle } from "../lib/formatters";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
export function GalleryPage() {
  useDocumentTitle("Galerie");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("gallery_images")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .then(({ data }) => {
        setImages((data ?? []) as GalleryImage[]);
        setLoading(false);
      });
  }, []);
  return (
    <>
      <Header />
      <main className="content-page">
        <header className="content-hero">
          <span className="eyebrow">L’univers Douceur d’ici</span>
          <h1>Galerie</h1>
          <p>
            Créations, matières et instants de l’atelier au fil des saisons.
          </p>
        </header>
        <section className="public-gallery section-shell">
          {loading ? (
            <div className="page-loading">
              <LoaderCircle className="spin" /> Chargement des photos…
            </div>
          ) : images.length ? (
            images.map((item) => (
              <figure key={item.id}>
                <img
                  src={item.image_url}
                  alt={
                    item.alt_text || item.caption || "Création Douceur d’ici"
                  }
                  loading="lazy"
                />
                <figcaption>{item.caption}</figcaption>
              </figure>
            ))
          ) : (
            <div className="empty-state">
              <ImageIcon />
              <h2>La galerie se prépare.</h2>
              <p>Les premières photos seront bientôt ajoutées.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
