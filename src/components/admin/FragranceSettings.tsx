import { useEffect, useState, type FormEvent } from "react";
import { Plus, Save, SprayCan, X } from "lucide-react";
import type { CatalogFragrance } from "../../data";
import { supabase } from "../../lib/supabase";
import { linkedItemMessage, slugify } from "./SettingsTypes";
import { SettingsActions } from "./SettingsActions";
import { SettingsPanel } from "./SettingsPanel";

export function FragranceSettings() {
  const [items, setItems] = useState<CatalogFragrance[]>([]);
  const [name, setName] = useState("");
  const [composition, setComposition] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const load = async () => {
    const { data } = await supabase!
      .from("catalog_fragrances")
      .select("*")
      .order("sort_order");
    setItems((data ?? []) as CatalogFragrance[]);
  };
  useEffect(() => {
    void supabase!
      .from("catalog_fragrances")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setItems((data ?? []) as CatalogFragrance[]));
  }, []);
  const reset = () => {
    setEditingId(null);
    setName("");
    setComposition("");
  };
  const edit = (item: CatalogFragrance) => {
    setEditingId(item.id);
    setName(item.name);
    setComposition(item.composition);
    setNotice("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    const values = { name: name.trim(), composition: composition.trim() };
    const query = editingId
      ? supabase!.from("catalog_fragrances").update(values).eq("id", editingId)
      : supabase!
          .from("catalog_fragrances")
          .insert({ ...values, slug: slugify(name), sort_order: items.length });
    const { error } = await query;
    if (error)
      setNotice(
        error.code === "23505"
          ? "Ce parfum existe déjà."
          : "Le parfum n’a pas pu être enregistré.",
      );
    else {
      setNotice(
        editingId ? "Parfum et composition modifiés." : "Parfum ajouté.",
      );
      reset();
      await load();
    }
  };
  const toggle = async (item: CatalogFragrance) => {
    await supabase!
      .from("catalog_fragrances")
      .update({ active: !item.active })
      .eq("id", item.id);
    await load();
  };
  const remove = async (item: CatalogFragrance) => {
    if (
      !window.confirm(
        `Supprimer définitivement le parfum « ${item.name} » et sa composition ?`,
      )
    )
      return;
    const { error } = await supabase!
      .from("catalog_fragrances")
      .delete()
      .eq("id", item.id);
    if (error)
      setNotice(
        error.code === "23503"
          ? linkedItemMessage
          : "Le parfum n’a pas pu être supprimé.",
      );
    else {
      if (editingId === item.id) reset();
      setNotice("Parfum supprimé.");
      await load();
    }
  };
  return (
    <SettingsPanel
      title="Parfums et compositions"
      description="Enregistrez chaque composition une fois, puis sélectionnez simplement le parfum dans un produit."
    >
      <form
        className="settings-add-form settings-add-form--fragrance"
        onSubmit={save}
      >
        <label>
          Nom du parfum
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Fleur de coton"
            required
            minLength={2}
          />
        </label>
        <label>
          Composition
          <textarea
            value={composition}
            onChange={(event) => setComposition(event.target.value)}
            placeholder="Cire végétale, fragrance…"
            required
            rows={3}
          />
        </label>
        <button className="button button--dark">
          {editingId ? <Save /> : <Plus />}{" "}
          {editingId ? "Enregistrer" : "Ajouter"}
        </button>
        {editingId && (
          <button type="button" className="settings-cancel" onClick={reset}>
            <X /> Annuler
          </button>
        )}
      </form>
      {notice && <p className="settings-notice">{notice}</p>}
      <div className="settings-list settings-list--fragrances">
        {items.map((item) => (
          <article key={item.id} className={!item.active ? "inactive" : ""}>
            <SprayCan />
            <div>
              <strong>{item.name}</strong>
              <small>{item.composition}</small>
            </div>
            <SettingsActions
              active={item.active}
              onEdit={() => edit(item)}
              onToggle={() => void toggle(item)}
              onRemove={() => void remove(item)}
            />
          </article>
        ))}
      </div>
    </SettingsPanel>
  );
}
