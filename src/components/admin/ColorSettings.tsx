import { useEffect, useState, type FormEvent } from "react";
import { Plus, Save, X } from "lucide-react";
import type { CatalogColor } from "../../data";
import { supabase } from "../../lib/supabase";
import { linkedItemMessage } from "./SettingsTypes";
import { SettingsActions } from "./SettingsActions";
import { SettingsPanel } from "./SettingsPanel";

export function ColorSettings() {
  const [items, setItems] = useState<CatalogColor[]>([]);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#E8DFD2");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingHex, setEditingHex] = useState("#E8DFD2");
  const [editNotice, setEditNotice] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    const { data } = await supabase!
      .from("catalog_colors")
      .select("*")
      .order("sort_order");
    setItems((data ?? []) as CatalogColor[]);
  };
  useEffect(() => {
    void supabase!
      .from("catalog_colors")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setItems((data ?? []) as CatalogColor[]));
  }, []);
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingHex("#E8DFD2");
    setEditNotice("");
  };
  const edit = (item: CatalogColor) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingHex(item.hex_code);
    setEditNotice("");
    setNotice("");
  };
  const add = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    const values = { name: name.trim(), hex_code: hex.toUpperCase() };
    const { error } = await supabase!
      .from("catalog_colors")
      .insert({ ...values, sort_order: items.length });
    if (error)
      setNotice(
        error.code === "23505"
          ? "Cette couleur existe déjà."
          : "La couleur n’a pas pu être enregistrée.",
      );
    else {
      setNotice("Couleur ajoutée.");
      setName("");
      setHex("#E8DFD2");
      await load();
    }
  };
  const saveEdit = async (event: FormEvent, item: CatalogColor) => {
    event.preventDefault();
    setEditNotice("");
    const { error } = await supabase!
      .from("catalog_colors")
      .update({ name: editingName.trim(), hex_code: editingHex.toUpperCase() })
      .eq("id", item.id);
    if (error)
      setEditNotice(
        error.code === "23505"
          ? "Cette couleur existe déjà."
          : "La couleur n’a pas pu être enregistrée.",
      );
    else {
      cancelEdit();
      setNotice(`La couleur « ${editingName.trim()} » a été modifiée.`);
      await load();
    }
  };
  const toggle = async (item: CatalogColor) => {
    await supabase!
      .from("catalog_colors")
      .update({ active: !item.active })
      .eq("id", item.id);
    await load();
  };
  const remove = async (item: CatalogColor) => {
    if (
      !window.confirm(`Supprimer définitivement la couleur « ${item.name} » ?`)
    )
      return;
    const { error } = await supabase!
      .from("catalog_colors")
      .delete()
      .eq("id", item.id);
    if (error)
      setNotice(
        error.code === "23503"
          ? linkedItemMessage
          : "La couleur n’a pas pu être supprimée.",
      );
    else {
      if (editingId === item.id) cancelEdit();
      setNotice("Couleur supprimée.");
      await load();
    }
  };
  return (
    <SettingsPanel
      title="Nuancier"
      description="Ces couleurs pourront être sélectionnées indépendamment sur chaque produit."
    >
      <form
        className="settings-add-form settings-add-form--color"
        onSubmit={add}
      >
        <label>
          Nom
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rose poudré"
            required
            minLength={2}
          />
        </label>
        <label>
          Couleur
          <input
            type="color"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
          />
        </label>
        <button className="button button--dark">
          <Plus /> Ajouter
        </button>
      </form>
      {notice && <p className="settings-notice">{notice}</p>}
      <div className="settings-list settings-list--colors">
        {items.map((item) =>
          editingId === item.id ? (
            <article key={item.id} className="color-row--editing">
              <form
                className="color-inline-editor"
                onSubmit={(event) => void saveEdit(event, item)}
              >
                <label>
                  Nom de la couleur
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    required
                    minLength={2}
                    autoFocus
                  />
                </label>
                <label>
                  Teinte
                  <span className="color-inline-picker">
                    <input
                      type="color"
                      value={editingHex}
                      onChange={(event) => setEditingHex(event.target.value)}
                    />
                    <small>{editingHex.toUpperCase()}</small>
                  </span>
                </label>
                <button className="color-inline-save">
                  <Save /> Enregistrer
                </button>
                <button
                  type="button"
                  className="color-inline-cancel"
                  onClick={cancelEdit}
                >
                  <X /> Annuler
                </button>
                {editNotice && (
                  <small className="color-inline-error">{editNotice}</small>
                )}
              </form>
            </article>
          ) : (
            <article key={item.id} className={!item.active ? "inactive" : ""}>
              <span
                className="color-chip"
                style={{ backgroundColor: item.hex_code }}
              />
              <div>
                <strong>{item.name}</strong>
                <small>{item.hex_code}</small>
              </div>
              <SettingsActions
                active={item.active}
                onEdit={() => edit(item)}
                onToggle={() => void toggle(item)}
                onRemove={() => void remove(item)}
              />
            </article>
          ),
        )}
      </div>
    </SettingsPanel>
  );
}
