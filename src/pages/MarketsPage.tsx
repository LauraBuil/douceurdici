import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, LoaderCircle } from "lucide-react";
import { type Market } from "../data";
import { supabase } from "../lib/supabase";
import { useDocumentTitle } from "../lib/formatters";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
export function MarketsPage() {
  useDocumentTitle("Calendrier des marchés");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("markets")
      .select("*")
      .eq("published", true)
      .gte("start_date", new Date().toISOString())
      .order("start_date")
      .then(({ data }) => {
        setMarkets((data ?? []) as Market[]);
        setLoading(false);
      });
  }, []);
  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  return (
    <>
      <Header />
      <main className="content-page">
        <header className="content-hero">
          <span className="eyebrow">Retrouvez-moi</span>
          <h1>Calendrier des marchés</h1>
          <p>
            Les prochaines dates où découvrir mes créations et me rencontrer.
          </p>
        </header>
        <section className="market-list section-shell">
          {loading ? (
            <div className="page-loading">
              <LoaderCircle className="spin" /> Chargement du calendrier…
            </div>
          ) : markets.length ? (
            markets.map((market) => (
              <article key={market.id}>
                <CalendarDays />
                <div>
                  <time dateTime={market.start_date}>
                    {dateLabel(market.start_date)}
                  </time>
                  <h2>{market.name}</h2>
                  <strong>{market.location}</strong>
                  {market.details && <p>{market.details}</p>}
                  <a
                    className="market-map-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(market.location)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le lieu sur la carte <ArrowRight />
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <CalendarDays />
              <h2>Les prochaines dates arrivent.</h2>
              <p>Le calendrier des marchés sera mis à jour prochainement.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
