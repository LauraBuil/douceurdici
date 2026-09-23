import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { GalleryImage } from "../../data";
import { supabase } from "../../lib/supabase";
export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    const { data } = await supabase!
      .from("gallery_images")
      .select("*")
      .order("sort_order");
    setImages((data ?? []) as GalleryImage[]);
    setLoading(false);
  };
  useEffect(() => {
    void supabase!
      .from("gallery_images")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setImages((data ?? []) as GalleryImage[]);
        setLoading(false);
      });
  }, []);
  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setSaving(true);
    setNotice("");
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${crypto.randomUUID()}-${safeName}`;
    const upload = await supabase!.storage
      .from("gallery-images")
      .upload(path, file, { cacheControl: "3600" });
    if (upload.error) {
      setNotice("La photo n’a pas pu être envoyée.");
      setSaving(false);
      return;
    }
    const imageUrl = supabase!.storage.from("gallery-images").getPublicUrl(path)
      .data.publicUrl;
    const { error } = await supabase!.from("gallery_images").insert({
      image_url: imageUrl,
      caption,
      alt_text: altText,
      published,
      sort_order: images.length,
    });
    if (error) setNotice("La photo n’a pas pu être ajoutée.");
    else {
      setFile(null);
      setCaption("");
      setAltText("");
      setNotice("Photo ajoutée à la galerie.");
      await load();
    }
    setSaving(false);
  };
  const save = async (image: GalleryImage) => {
    const { error } = await supabase!
      .from("gallery_images")
      .update({
        caption: image.caption,
        alt_text: image.alt_text,
        published: image.published,
        sort_order: image.sort_order,
      })
      .eq("id", image.id);
    setNotice(
      error
        ? "Les changements n’ont pas pu être enregistrés."
        : "Galerie mise à jour.",
    );
  };
  const remove = async (image: GalleryImage) => {
    if (!window.confirm("Supprimer cette photo de la galerie ?")) return;
    const { error } = await supabase!
      .from("gallery_images")
      .delete()
      .eq("id", image.id);
    if (error) setNotice("La photo n’a pas pu être supprimée.");
    else {
      setNotice("Photo supprimée.");
      await load();
    }
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const current = next[index];
    next[index] = { ...next[target], sort_order: index };
    next[target] = { ...current, sort_order: target };
    setImages(next);
    void Promise.all([save(next[index]), save(next[target])]);
  };
  return (
    <div className="admin-module">
      <form className="admin-inline-form" onSubmit={add}>
        <div>
          <h2>Ajouter une photo</h2>
          <p>
            Choisissez une image, ajoutez une légende et publiez-la quand elle
            est prête.
          </p>
        </div>
        <label>
          Photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Légende
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Bougie fleurie coulée à la main"
          />
        </label>
        <label>
          Description de l’image
          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Décrivez la photo en quelques mots"
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />{" "}
          Publier immédiatement
        </label>
        <button className="button button--dark" disabled={saving}>
          {saving ? <LoaderCircle className="spin" /> : <Plus />} Ajouter la
          photo
        </button>
      </form>
      {notice && <p className="admin-notice">{notice}</p>}
      {loading ? (
        <div className="admin-loading-inline">
          <LoaderCircle className="spin" /> Chargement de la galerie…
        </div>
      ) : images.length ? (
        <div className="admin-gallery-grid">
          {images.map((item, index) => (
            <article
              key={item.id}
              className={!item.published ? "is-draft" : ""}
            >
              <img src={item.image_url} alt="" />
              <div>
                <label>
                  Légende
                  <input
                    value={item.caption}
                    onChange={(event) =>
                      setImages((current) =>
                        current.map((image) =>
                          image.id === item.id
                            ? { ...image, caption: event.target.value }
                            : image,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Description
                  <input
                    value={item.alt_text}
                    onChange={(event) =>
                      setImages((current) =>
                        current.map((image) =>
                          image.id === item.id
                            ? { ...image, alt_text: event.target.value }
                            : image,
                        ),
                      )
                    }
                  />
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={item.published}
                    onChange={(event) =>
                      setImages((current) =>
                        current.map((image) =>
                          image.id === item.id
                            ? { ...image, published: event.target.checked }
                            : image,
                        ),
                      )
                    }
                  />{" "}
                  {item.published ? "En ligne" : "Brouillon"}
                </label>
                <div className="admin-gallery-actions">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Monter"
                  >
                    <ArrowUp />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Descendre"
                  >
                    <ArrowDown />
                  </button>
                  <button onClick={() => void save(item)}>
                    <Save /> Enregistrer
                  </button>
                  <button className="danger" onClick={() => void remove(item)}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ImageIcon />
          <h2>Votre galerie est prête.</h2>
          <p>Ajoutez votre première photo ci-dessus.</p>
        </div>
      )}
    </div>
  );
}
