import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import type { Market } from "../../data";
import { supabase } from "../../lib/supabase";
const emptyMarket = {
  name: "",
  location: "",
  start_date: "",
  end_date: "",
  details: "",
  published: true,
};

export function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [form, setForm] = useState(emptyMarket);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const load = async () => {
    const { data } = await supabase!
      .from("markets")
      .select("*")
      .order("start_date");
    setMarkets((data ?? []) as Market[]);
    setLoading(false);
  };
  useEffect(() => {
    void supabase!
      .from("markets")
      .select("*")
      .order("start_date")
      .then(({ data }) => {
        setMarkets((data ?? []) as Market[]);
        setLoading(false);
      });
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const payload = {
      ...form,
      start_date: new Date(form.start_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    };
    const query = editingId
      ? supabase!.from("markets").update(payload).eq("id", editingId)
      : supabase!.from("markets").insert(payload);
    const { error } = await query;
    if (error) setNotice("La date n’a pas pu être enregistrée.");
    else {
      setForm(emptyMarket);
      setEditingId(null);
      setNotice("Calendrier mis à jour.");
      await load();
    }
    setSaving(false);
  };
  const edit = (market: Market) => {
    const localValue = (value: string | null) =>
      value
        ? new Date(
            new Date(value).getTime() -
              new Date(value).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "";
    setEditingId(market.id);
    setForm({
      name: market.name,
      location: market.location,
      start_date: localValue(market.start_date),
      end_date: localValue(market.end_date),
      details: market.details,
      published: market.published,
    });
  };
  const remove = async (market: Market) => {
    if (!window.confirm(`Supprimer « ${market.name} » du calendrier ?`)) return;
    const { error } = await supabase!
      .from("markets")
      .delete()
      .eq("id", market.id);
    setNotice(error ? "La date n’a pas pu être supprimée." : "Date supprimée.");
    if (!error) await load();
  };
  const days = useMemo(() => {
    const year = month.getFullYear(),
      monthIndex = month.getMonth();
    const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const count = new Date(year, monthIndex + 1, 0).getDate();
    return [
      ...Array(firstOffset).fill(null),
      ...Array.from(
        { length: count },
        (_, index) => new Date(year, monthIndex, index + 1),
      ),
    ];
  }, [month]);
  const scheduled = (day: Date) =>
    markets.some((market) => {
      const date = new Date(market.start_date);
      return (
        date.getFullYear() === day.getFullYear() &&
        date.getMonth() === day.getMonth() &&
        date.getDate() === day.getDate()
      );
    });
  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(month);
  const dateLabel = (date: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  return (
    <div className="admin-module">
      <div className="admin-calendar">
        <header>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            aria-label="Mois précédent"
          >
            <ChevronLeft />
          </button>
          <h2>{monthLabel}</h2>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            aria-label="Mois suivant"
          >
            <ChevronRight />
          </button>
        </header>
        <div className="admin-calendar-grid">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <strong key={day}>{day}</strong>
          ))}
          {days.map((day, index) =>
            day ? (
              <span
                key={day.toISOString()}
                className={scheduled(day) ? "has-market" : ""}
              >
                {day.getDate()}
              </span>
            ) : (
              <i key={`empty-${index}`} />
            ),
          )}
        </div>
      </div>
      <form className="admin-inline-form market-form" onSubmit={submit}>
        <div>
          <h2>{editingId ? "Modifier le marché" : "Ajouter un marché"}</h2>
          <p>
            Renseignez le lieu, la date et les informations utiles aux
            visiteurs.
          </p>
        </div>
        <label>
          Nom du marché
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          Lieu
          <input
            value={form.location}
            onChange={(event) =>
              setForm({ ...form, location: event.target.value })
            }
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Début
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(event) =>
                setForm({ ...form, start_date: event.target.value })
              }
              required
            />
          </label>
          <label>
            Fin, facultative
            <input
              type="datetime-local"
              value={form.end_date}
              onChange={(event) =>
                setForm({ ...form, end_date: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          Informations
          <textarea
            rows={3}
            value={form.details}
            onChange={(event) =>
              setForm({ ...form, details: event.target.value })
            }
            placeholder="Horaires, emplacement, accès…"
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) =>
              setForm({ ...form, published: event.target.checked })
            }
          />{" "}
          Publier sur le site
        </label>
        <div className="button-row">
          {editingId && (
            <button
              type="button"
              className="button button--light"
              onClick={() => {
                setEditingId(null);
                setForm(emptyMarket);
              }}
            >
              Annuler
            </button>
          )}
          <button className="button button--dark" disabled={saving}>
            {saving ? <LoaderCircle className="spin" /> : <Save />} Enregistrer
          </button>
        </div>
      </form>
      {notice && <p className="admin-notice">{notice}</p>}
      {loading ? (
        <div className="admin-loading-inline">
          <LoaderCircle className="spin" /> Chargement du calendrier…
        </div>
      ) : (
        <div className="admin-market-list">
          {markets.map((market) => (
            <article
              key={market.id}
              className={!market.published ? "is-draft" : ""}
            >
              <CalendarDays />
              <div>
                <time>{dateLabel(market.start_date)}</time>
                <h3>{market.name}</h3>
                <p>
                  <MapPin /> {market.location}
                </p>
                <small>{market.published ? "Publié" : "Brouillon"}</small>
              </div>
              <div>
                <button onClick={() => edit(market)}>
                  <Pencil /> Modifier
                </button>
                <button className="danger" onClick={() => void remove(market)}>
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
