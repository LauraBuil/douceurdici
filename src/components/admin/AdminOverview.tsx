import { useEffect, useState } from "react";
import { CalendarDays, Image as ImageIcon, ShoppingBag } from "lucide-react";
import type { AdminView } from "./AdminTypes";
import { supabase } from "../../lib/supabase";
export function AdminOverview({
  onOpen,
  productCount,
}: {
  onOpen: (view: AdminView) => void;
  productCount: number;
}) {
  const [counts, setCounts] = useState({ gallery: 0, markets: 0 });
  useEffect(() => {
    Promise.all([
      supabase!
        .from("gallery_images")
        .select("id", { count: "exact", head: true }),
      supabase!.from("markets").select("id", { count: "exact", head: true }),
    ]).then(([gallery, markets]) => {
      setCounts({ gallery: gallery.count ?? 0, markets: markets.count ?? 0 });
    });
  }, []);
  const cards = [
    {
      view: "products" as const,
      label: "Produits",
      value: productCount,
      unit: "créations",
      icon: ShoppingBag,
    },
    {
      view: "gallery" as const,
      label: "Galerie photos",
      value: counts.gallery,
      unit: "photos",
      icon: ImageIcon,
    },
    {
      view: "markets" as const,
      label: "Calendrier des marchés",
      value: counts.markets,
      unit: "dates",
      icon: CalendarDays,
    },
  ];
  return (
    <div className="admin-overview">
      <div className="admin-cards">
        {cards.map(({ view, label, value, unit, icon: Icon }) => (
          <button key={view} onClick={() => onOpen(view)}>
            <Icon />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{unit}</small>
          </button>
        ))}
      </div>
      <section className="admin-help">
        <h2>Comment ça marche</h2>
        <ul>
          <li>
            Un contenu en <strong>brouillon</strong> reste invisible sur le
            site.
          </li>
          <li>
            Les <strong>couleurs</strong> sont indépendantes des parfums et
            s’affichent sous forme de nuancier.
          </li>
          <li>
            La <strong>composition</strong> est enregistrée une seule fois avec
            son parfum, puis réutilisée sur les produits.
          </li>
          <li>
            Chaque produit peut présenter plusieurs photos et associer une photo
            à une couleur.
          </li>
          <li>
            Vous pouvez enregistrer un prix puis choisir de le{" "}
            <strong>masquer</strong> en attendant la boutique en ligne.
          </li>
        </ul>
      </section>
    </div>
  );
}
