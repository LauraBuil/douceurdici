import { useEffect, useState, type FormEvent } from "react";
import { FolderTree, Plus, Save, X } from "lucide-react";
import type { CatalogCategory } from "../../data";
import { supabase } from "../../lib/supabase";
import { linkedItemMessage, slugify, type CategoryKind } from "./SettingsTypes";
import { SettingsActions } from "./SettingsActions";
import { SettingsPanel } from "./SettingsPanel";

export function CategorySettings() {
  const [items, setItems] = useState<CatalogCategory[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("child");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const load = async () => {
    const { data } = await supabase!
      .from("catalog_categories")
      .select("*")
      .order("sort_order");
    setItems((data ?? []) as CatalogCategory[]);
  };
  useEffect(() => {
    void supabase!
      .from("catalog_categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setItems((data ?? []) as CatalogCategory[]));
  }, []);
  const roots = items.filter((item) => !item.parent_id);
  const reset = () => {
    setEditingId(null);
    setName("");
    setKind("child");
    setParentId("");
  };
  const edit = (item: CatalogCategory) => {
    setEditingId(item.id);
    setName(item.name);
    setKind(item.parent_id ? "child" : "root");
    setParentId(item.parent_id ?? "");
    setNotice("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    if (kind === "child" && !parentId) {
      setNotice("Choisissez la catégorie principale de cette sous-catégorie.");
      return;
    }
    if (
      editingId &&
      kind === "child" &&
      items.some((item) => item.parent_id === editingId)
    ) {
      setNotice(
        "Déplacez ou supprimez d’abord les sous-catégories rattachées à cette catégorie principale.",
      );
      return;
    }
    const values = {
      name: name.trim(),
      parent_id: kind === "child" ? parentId : null,
    };
    const query = editingId
      ? supabase!.from("catalog_categories").update(values).eq("id", editingId)
      : supabase!
          .from("catalog_categories")
          .insert({ ...values, slug: slugify(name), sort_order: items.length });
    const { error } = await query;
    if (error)
      setNotice(
        error.code === "23505"
          ? "Cette catégorie existe déjà."
          : "La catégorie n’a pas pu être enregistrée.",
      );
    else {
      setNotice(editingId ? "Catégorie modifiée." : "Catégorie ajoutée.");
      reset();
      await load();
    }
  };
  const toggle = async (item: CatalogCategory) => {
    await supabase!
      .from("catalog_categories")
      .update({ active: !item.active })
      .eq("id", item.id);
    await load();
  };
  const remove = async (item: CatalogCategory) => {
    if (
      !window.confirm(
        `Supprimer définitivement la catégorie « ${item.name} » ?`,
      )
    )
      return;
    const { error } = await supabase!
      .from("catalog_categories")
      .delete()
      .eq("id", item.id);
    if (error)
      setNotice(
        error.code === "23503"
          ? linkedItemMessage
          : "La catégorie n’a pas pu être supprimée.",
      );
    else {
      if (editingId === item.id) reset();
      setNotice("Catégorie supprimée.");
      await load();
    }
  };
  return (
    <SettingsPanel
      title="Catégories et sous-catégories"
      description="Créez une sous-catégorie personnalisée en lui donnant un nom et en choisissant sa catégorie principale."
    >
      <form
        className="settings-add-form settings-add-form--category"
        onSubmit={save}
      >
        <label>
          Nom
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={kind === "child" ? "Bébé & naissance" : "Décorations"}
            required
            minLength={2}
          />
        </label>
        <label>
          Type d’élément
          <select
            value={kind}
            onChange={(event) => {
              const nextKind = event.target.value as CategoryKind;
              setKind(nextKind);
              if (nextKind === "root") setParentId("");
            }}
          >
            <option value="child">Sous-catégorie personnalisée</option>
            <option value="root">Catégorie principale</option>
          </select>
        </label>
        <label>
          Catégorie principale
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            disabled={kind === "root"}
            required={kind === "child"}
          >
            <option value="">
              {kind === "root"
                ? "Non applicable"
                : "Choisir la catégorie parente"}
            </option>
            {roots
              .filter((root) => root.id !== editingId)
              .map((root) => (
                <option key={root.id} value={root.id}>
                  {root.name}
                </option>
              ))}
          </select>
        </label>
        <button className="button button--dark">
          {editingId ? <Save /> : <Plus />}{" "}
          {editingId
            ? "Enregistrer"
            : kind === "child"
              ? "Ajouter la sous-catégorie"
              : "Ajouter la catégorie"}
        </button>
        {editingId && (
          <button type="button" className="settings-cancel" onClick={reset}>
            <X /> Annuler
          </button>
        )}
      </form>
      {notice && <p className="settings-notice">{notice}</p>}
      <div className="category-groups">
        {roots.map((root) => {
          const children = items.filter((item) => item.parent_id === root.id);
          return (
            <section
              key={root.id}
              className={`category-group ${!root.active ? "inactive" : ""}`}
            >
              <div className="category-group-root">
                <FolderTree />
                <div>
                  <strong>{root.name}</strong>
                  <small>
                    Catégorie principale · {children.length} sous-catégorie
                    {children.length > 1 ? "s" : ""}
                  </small>
                </div>
                <SettingsActions
                  active={root.active}
                  onEdit={() => edit(root)}
                  onToggle={() => void toggle(root)}
                  onRemove={() => void remove(root)}
                />
              </div>
              {children.length > 0 ? (
                <div className="category-group-children">
                  {children.map((child) => (
                    <article
                      key={child.id}
                      className={!child.active ? "inactive" : ""}
                    >
                      <span className="category-branch" aria-hidden="true" />
                      <div>
                        <strong>{child.name}</strong>
                        <small>Sous-catégorie</small>
                      </div>
                      <SettingsActions
                        active={child.active}
                        onEdit={() => edit(child)}
                        onToggle={() => void toggle(child)}
                        onRemove={() => void remove(child)}
                      />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="category-group-empty">
                  Aucune sous-catégorie pour le moment.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
