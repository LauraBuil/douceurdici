import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Image as ImageIcon,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  type CatalogCategory,
  type CatalogColor,
  type CatalogFragrance,
  type Product,
  type ProductImage,
} from "../../data";
import { supabase } from "../../lib/supabase";
import type { ProductVariantDraft } from "./AdminTypes";
import { ProductInformationFields } from "./ProductInformationFields";
import { VariantStockEditor } from "./VariantStockEditor";

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  slug: "",
  category: "",
  category_id: null,
  short_description: "",
  description: "",
  price: 0,
  stock: 0,
  price_visible: true,
  color: "",
  scent: "",
  composition: "",
  weight: "",
  image_url: "",
  featured: false,
  published: true,
  sort_order: 0,
};

type PendingProductImage = { localId: string; file: File; color_id: string };

export function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<Product, "id">>(
    product ? { ...emptyProduct, ...product } : emptyProduct,
  );
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [colors, setColors] = useState<CatalogColor[]>([]);
  const [fragrances, setFragrances] = useState<CatalogFragrance[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const linked = (product?.product_categories ?? []).map(
      (link) => link.category_id,
    );
    return linked.length
      ? linked
      : product?.category_id
        ? [product.category_id]
        : [];
  });
  const [selectedColors, setSelectedColors] = useState<string[]>(() => [
    ...new Set([
      ...(product?.product_colors ?? []).map((link) => link.color_id),
      ...(product?.product_images ?? [])
        .map((image) => image.color_id)
        .filter((id): id is string => Boolean(id)),
    ]),
  ]);
  const [selectedFragrances, setSelectedFragrances] = useState<string[]>(
    (product?.product_fragrances ?? []).map((link) => link.fragrance_id),
  );
  const [variantStocks, setVariantStocks] = useState<ProductVariantDraft[]>(
    (product?.product_variants ?? []).map((variant) => ({
      colorId: variant.color_id,
      fragranceId: variant.fragrance_id,
      stock: variant.stock,
    })),
  );
  const [images, setImages] = useState<ProductImage[]>(
    [...(product?.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const initialPrimary = product?.product_images?.find(
    (image) => image.is_primary,
  )?.id;
  const [primaryImageKey, setPrimaryImageKey] = useState(
    initialPrimary ? `existing:${initialPrimary}` : "",
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "stock" | "gallery">(
    "details",
  );
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    Promise.all([
      supabase!.from("catalog_categories").select("*").order("sort_order"),
      supabase!.from("catalog_colors").select("*").order("sort_order"),
      supabase!.from("catalog_fragrances").select("*").order("sort_order"),
    ]).then(([categoryResult, colorResult, fragranceResult]) => {
      const availableCategories = (categoryResult.data ??
        []) as CatalogCategory[];
      setCategories(availableCategories);
      setColors((colorResult.data ?? []) as CatalogColor[]);
      setFragrances((fragranceResult.data ?? []) as CatalogFragrance[]);
      const defaultCategory =
        availableCategories.find(
          (category) => !category.parent_id && category.active,
        ) ?? availableCategories.find((category) => category.active);
      if (defaultCategory) {
        setForm((current) =>
          current.category_id
            ? current
            : { ...current, category_id: defaultCategory.id },
        );
        setSelectedCategories((current) =>
          current.length ? current : [defaultCategory.id],
        );
      }
    });
  }, []);

  const toggleChoice = (
    value: string,
    selected: string[],
    setter: (values: string[]) => void,
  ) =>
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  const toggleCategory = (categoryId: string) => {
    const next = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(next);
    if (!next.includes(form.category_id ?? ""))
      update("category_id", next[0] ?? null);
  };
  const linkPhotoColor = (colorId: string) => {
    if (colorId)
      setSelectedColors((current) =>
        current.includes(colorId) ? current : [...current, colorId],
      );
  };
  const removeExistingImage = (image: ProductImage) => {
    setDirty(true);
    setImages((current) => current.filter((item) => item.id !== image.id));
    setRemovedImageIds((current) => [...current, image.id]);
    if (primaryImageKey === `existing:${image.id}`) setPrimaryImageKey("");
  };
  const requestClose = () => {
    if (
      !dirtyRef.current ||
      window.confirm("Quitter sans enregistrer vos modifications ?")
    )
      onClose();
  };

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        (!dirtyRef.current ||
          window.confirm("Quitter sans enregistrer vos modifications ?"))
      )
        onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const category = categories.find(
      (item) =>
        item.id ===
        (selectedCategories.includes(form.category_id ?? "")
          ? form.category_id
          : selectedCategories[0]),
    );
    if (!category || !selectedCategories.length) {
      setError("Sélectionnez au moins une catégorie.");
      setSaving(false);
      return;
    }
    const rootCategory = category.parent_id
      ? categories.find((item) => item.id === category.parent_id)
      : category;
    const variantColorIds = selectedColors.length ? selectedColors : [null];
    const variantFragranceIds = selectedFragrances.length
      ? selectedFragrances
      : [null];
    const effectiveVariantStocks = variantColorIds.flatMap((colorId) =>
      variantFragranceIds.map((fragranceId) => {
        const existing = variantStocks.find(
          (variant) =>
            variant.colorId === colorId && variant.fragranceId === fragranceId,
        );
        return {
          colorId,
          fragranceId,
          stock: existing?.stock ?? 0,
        };
      }),
    );
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      category: rootCategory?.slug ?? category.slug,
      category_id: category.id,
      short_description: form.short_description,
      description: form.description,
      price: Number(form.price),
      stock: effectiveVariantStocks.reduce(
        (total, variant) => total + variant.stock,
        0,
      ),
      price_visible: form.price_visible,
      color: "",
      scent: "",
      composition: "",
      weight: form.weight || null,
      image_url: form.image_url,
      featured: form.featured,
      published: form.published,
      sort_order: form.sort_order,
    };
    const query = product
      ? supabase!
          .from("products")
          .update(payload)
          .eq("id", product.id)
          .select("id")
          .single()
      : supabase!.from("products").insert(payload).select("id").single();
    const { data: savedProduct, error: saveError } = await query;
    if (saveError || !savedProduct) {
      setError(
        saveError?.code === "23505"
          ? "Un produit utilise déjà ce nom."
          : "Le produit n’a pas pu être enregistré.",
      );
      setSaving(false);
      return;
    }

    await Promise.all([
      supabase!
        .from("product_categories")
        .delete()
        .eq("product_id", savedProduct.id),
      supabase!
        .from("product_colors")
        .delete()
        .eq("product_id", savedProduct.id),
      supabase!
        .from("product_fragrances")
        .delete()
        .eq("product_id", savedProduct.id),
    ]);
    const photoColorIds = [
      ...images.map((image) => image.color_id),
      ...pendingImages.map((image) => image.color_id),
    ].filter((id): id is string => Boolean(id));
    const savedColorIds = [...new Set([...selectedColors, ...photoColorIds])];
    const optionResults = await Promise.all([
      supabase!.from("product_categories").insert(
        selectedCategories.map((category_id) => ({
          product_id: savedProduct.id,
          category_id,
        })),
      ),
      savedColorIds.length
        ? supabase!.from("product_colors").insert(
            savedColorIds.map((color_id) => ({
              product_id: savedProduct.id,
              color_id,
            })),
          )
        : Promise.resolve({ error: null }),
      selectedFragrances.length
        ? supabase!.from("product_fragrances").insert(
            selectedFragrances.map((fragrance_id) => ({
              product_id: savedProduct.id,
              fragrance_id,
            })),
          )
        : Promise.resolve({ error: null }),
    ]);
    if (optionResults.some((result) => result.error)) {
      setError(
        "Le produit est enregistré, mais ses catégories ou ses options n’ont pas pu être mises à jour.",
      );
      setSaving(false);
      return;
    }
    await supabase!
      .from("product_variants")
      .delete()
      .eq("product_id", savedProduct.id);
    if (effectiveVariantStocks.length) {
      const variantResult = await supabase!.from("product_variants").insert(
        effectiveVariantStocks.map((variant, index) => ({
          product_id: savedProduct.id,
          color_id: variant.colorId,
          fragrance_id: variant.fragranceId,
          color: colors.find((item) => item.id === variant.colorId)?.name ?? "",
          scent:
            fragrances.find((item) => item.id === variant.fragranceId)?.name ??
            "",
          composition:
            fragrances.find((item) => item.id === variant.fragranceId)
              ?.composition ?? "",
          stock: variant.stock,
          sort_order: index,
        })),
      );
      if (variantResult.error) {
        setError(
          "Le produit est enregistré, mais ses stocks par déclinaison n’ont pas pu être mis à jour.",
        );
        setSaving(false);
        return;
      }
    }

    if (removedImageIds.length)
      await supabase!.from("product_images").delete().in("id", removedImageIds);
    if (images.length) {
      await supabase!
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", savedProduct.id);
      const fallbackPrimary = primaryImageKey || `existing:${images[0].id}`;
      await Promise.all(
        images.map((image, index) =>
          supabase!
            .from("product_images")
            .update({
              color_id: image.color_id || null,
              is_primary: fallbackPrimary === `existing:${image.id}`,
              sort_order: index,
              alt_text: image.alt_text || form.name,
            })
            .eq("id", image.id),
        ),
      );
    }

    const {
      data: { user },
    } = await supabase!.auth.getUser();
    const uploaded: { localId: string; image_url: string }[] = [];
    for (const pending of pendingImages) {
      const safeName = pending.file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-");
      const path = `${user!.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase!.storage
        .from("product-images")
        .upload(path, pending.file, { cacheControl: "3600", upsert: false });
      if (upload.error) {
        setError("Une des photos n’a pas pu être envoyée.");
        setSaving(false);
        return;
      }
      uploaded.push({
        localId: pending.localId,
        image_url: supabase!.storage.from("product-images").getPublicUrl(path)
          .data.publicUrl,
      });
    }
    const fallbackPendingPrimary =
      !primaryImageKey && images.length === 0
        ? pendingImages[0]?.localId
        : null;
    if (pendingImages.length) {
      const { error: imageError } = await supabase!
        .from("product_images")
        .insert(
          pendingImages.map((pending, index) => ({
            product_id: savedProduct.id,
            color_id: pending.color_id || null,
            image_url: uploaded.find(
              (item) => item.localId === pending.localId,
            )!.image_url,
            alt_text: form.name,
            is_primary:
              primaryImageKey === `pending:${pending.localId}` ||
              fallbackPendingPrimary === pending.localId,
            sort_order: images.length + index,
          })),
        );
      if (imageError) {
        setError(
          "Les photos ont été envoyées mais n’ont pas pu être associées au produit.",
        );
        setSaving(false);
        return;
      }
    }
    const primaryExisting = images.find(
      (image) =>
        (primaryImageKey || `existing:${images[0]?.id}`) ===
        `existing:${image.id}`,
    )?.image_url;
    const primaryPendingId = primaryImageKey.startsWith("pending:")
      ? primaryImageKey.replace("pending:", "")
      : fallbackPendingPrimary;
    const primaryPending = uploaded.find(
      (item) => item.localId === primaryPendingId,
    )?.image_url;
    await supabase!
      .from("products")
      .update({
        image_url:
          primaryPending ??
          primaryExisting ??
          (images.length || pendingImages.length ? form.image_url : ""),
      })
      .eq("id", savedProduct.id);
    setDirty(false);
    onSaved();
    setSaving(false);
  };

  const activeCategories = categories.filter(
    (item) => item.active || selectedCategories.includes(item.id),
  );
  const roots = categories.filter((item) => !item.parent_id);
  return (
    <motion.div
      className="editor-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <motion.section
        ref={panelRef}
        tabIndex={-1}
        className="editor-panel"
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 16 }}
        aria-modal="true"
        role="dialog"
        aria-labelledby="editor-title"
      >
        <header>
          <div>
            <span className="eyebrow">Catalogue</span>
            <h2 id="editor-title">
              {product ? "Modifier le produit" : "Nouveau produit"}
            </h2>
          </div>
          <button onClick={requestClose} aria-label="Fermer">
            <X />
          </button>
        </header>
        <form onSubmit={submit} onChangeCapture={() => setDirty(true)}>
          <nav className="editor-tabs" aria-label="Sections du produit">
            <button
              type="button"
              className={activeTab === "details" ? "active" : ""}
              onClick={() => setActiveTab("details")}
            >
              Informations
            </button>
            <button
              type="button"
              className={activeTab === "stock" ? "active" : ""}
              onClick={() => setActiveTab("stock")}
            >
              Stocks
            </button>
            <button
              type="button"
              className={activeTab === "gallery" ? "active" : ""}
              onClick={() => setActiveTab("gallery")}
            >
              Galerie
            </button>
          </nav>
          {activeTab === "details" && (
            <ProductInformationFields
              form={form}
              update={update}
              colors={colors}
              fragrances={fragrances}
              activeCategories={activeCategories}
              roots={roots}
              selectedCategories={selectedCategories}
              selectedColors={selectedColors}
              selectedFragrances={selectedFragrances}
              toggleCategory={toggleCategory}
              toggleChoice={toggleChoice}
              setSelectedColors={setSelectedColors}
              setSelectedFragrances={setSelectedFragrances}
              onNameChange={(value) => {
                update("name", value);
                if (!product) update("slug", slugify(value));
              }}
            />
          )}
          <div className={"editor-tab-panel is-hidden"}>
            <label>
              Nom du produit
              <input
                value={form.name}
                onChange={(event) => {
                  update("name", event.target.value);
                  if (!product) update("slug", slugify(event.target.value));
                }}
                required
              />
            </label>
            <fieldset className="product-category-choice">
              <legend>Catégories du produit</legend>
              <p>
                Cochez toutes les collections dans lesquelles ce produit doit
                apparaître.
              </p>
              <div className="product-category-groups">
                {roots
                  .filter(
                    (root) =>
                      root.active ||
                      selectedCategories.includes(root.id) ||
                      activeCategories.some(
                        (item) => item.parent_id === root.id,
                      ),
                  )
                  .map((root) => {
                    const children = activeCategories.filter(
                      (item) => item.parent_id === root.id,
                    );
                    return (
                      <section key={root.id}>
                        <label
                          className={`product-category-root ${selectedCategories.includes(root.id) ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(root.id)}
                            onChange={() => toggleCategory(root.id)}
                          />
                          <span>
                            <strong>{root.name}</strong>
                            <small>Collection principale</small>
                          </span>
                        </label>
                        {children.length > 0 && (
                          <div className="product-subcategory-choices">
                            {children.map((child) => (
                              <label
                                key={child.id}
                                className={
                                  selectedCategories.includes(child.id)
                                    ? "selected"
                                    : ""
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(
                                    child.id,
                                  )}
                                  onChange={() => toggleCategory(child.id)}
                                />
                                {child.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
              </div>
            </fieldset>
            <div className="form-grid">
              <label>
                Prix en €
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    update("price", Number(event.target.value))
                  }
                  required
                />
              </label>
            </div>
            <fieldset className="catalog-choice">
              <legend>Couleurs disponibles</legend>
              <p>Les couleurs sont indépendantes des parfums.</p>
              <div className="choice-grid">
                {colors
                  .filter(
                    (item) => item.active || selectedColors.includes(item.id),
                  )
                  .map((color) => (
                    <label
                      key={color.id}
                      className={
                        selectedColors.includes(color.id) ? "selected" : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color.id)}
                        onChange={() =>
                          toggleChoice(
                            color.id,
                            selectedColors,
                            setSelectedColors,
                          )
                        }
                      />
                      <span
                        className="color-chip"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      {color.name}
                    </label>
                  ))}
              </div>
              {!colors.length && (
                <small>Ajoutez d’abord des couleurs dans Paramètres.</small>
              )}
            </fieldset>
          </div>
          <div
            className={
              activeTab === "stock"
                ? "editor-tab-panel"
                : "editor-tab-panel is-hidden"
            }
          >
            <VariantStockEditor
              colors={colors}
              fragrances={fragrances}
              selectedColors={selectedColors}
              selectedFragrances={selectedFragrances}
              value={variantStocks}
              onChange={setVariantStocks}
            />
          </div>
          <div className={"editor-tab-panel is-hidden"}>
            <fieldset className="catalog-choice">
              <legend>Parfums proposés</legend>
              <p>
                La composition affichée vient automatiquement du parfum
                sélectionné.
              </p>
              <div className="fragrance-choice-grid">
                {fragrances
                  .filter(
                    (item) =>
                      item.active || selectedFragrances.includes(item.id),
                  )
                  .map((fragrance) => (
                    <label
                      key={fragrance.id}
                      className={
                        selectedFragrances.includes(fragrance.id)
                          ? "selected"
                          : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedFragrances.includes(fragrance.id)}
                        onChange={() =>
                          toggleChoice(
                            fragrance.id,
                            selectedFragrances,
                            setSelectedFragrances,
                          )
                        }
                      />
                      <span>
                        <strong>{fragrance.name}</strong>
                        <small>{fragrance.composition}</small>
                      </span>
                    </label>
                  ))}
              </div>
              {!fragrances.length && (
                <small>Ajoutez d’abord des parfums dans Paramètres.</small>
              )}
            </fieldset>
            <label>
              Description courte
              <input
                value={form.short_description}
                onChange={(event) =>
                  update("short_description", event.target.value)
                }
                placeholder="Une phrase visible dans le catalogue"
                required
              />
            </label>
            <label>
              Description détaillée
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={4}
                required
              />
            </label>
            <div className="form-grid">
              <label>
                Poids / format
                <input
                  value={form.weight ?? ""}
                  onChange={(event) => update("weight", event.target.value)}
                  placeholder="180 g"
                />
              </label>
              <label>
                Ordre d’affichage
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(event) =>
                    update("sort_order", Number(event.target.value))
                  }
                />
              </label>
            </div>
          </div>
          <div
            className={
              activeTab === "gallery"
                ? "editor-tab-panel"
                : "editor-tab-panel is-hidden"
            }
          >
            <fieldset className="product-images-editor">
              <legend>Galerie du produit</legend>
              <p>
                Ajoutez plusieurs photos, puis indiquez la couleur représentée
                sur chacune d’elles.
              </p>
              <label className="multi-upload">
                <Upload />
                Ajouter des photos
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const additions = Array.from(event.target.files ?? []).map(
                      (file) => ({
                        localId: crypto.randomUUID(),
                        file,
                        color_id: "",
                      }),
                    );
                    setPendingImages((current) => [...current, ...additions]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <div className="product-image-list">
                {images.map((image) => (
                  <article key={image.id}>
                    <img src={image.image_url} alt={image.alt_text} />
                    <div>
                      <label className="photo-color-link">
                        <span>Couleur montrée sur cette photo</span>
                        <select
                          aria-label={`Couleur de la photo ${image.alt_text || form.name}`}
                          value={image.color_id ?? ""}
                          onChange={(event) => {
                            const colorId = event.target.value;
                            linkPhotoColor(colorId);
                            setImages((current) =>
                              current.map((item) =>
                                item.id === image.id
                                  ? { ...item, color_id: colorId || null }
                                  : item,
                              ),
                            );
                          }}
                        >
                          <option value="">
                            Photo commune à toutes les couleurs
                          </option>
                          {colors.map((color) => (
                            <option key={color.id} value={color.id}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="primary-image"
                          checked={
                            primaryImageKey === `existing:${image.id}` ||
                            (!primaryImageKey && image === images[0])
                          }
                          onChange={() =>
                            setPrimaryImageKey(`existing:${image.id}`)
                          }
                        />{" "}
                        Photo principale
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image)}
                      aria-label="Retirer cette photo"
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))}
                {pendingImages.map((pending) => (
                  <article key={pending.localId}>
                    <div className="pending-image-name">
                      <ImageIcon />
                      {pending.file.name}
                    </div>
                    <div>
                      <label className="photo-color-link">
                        <span>Couleur montrée sur cette photo</span>
                        <select
                          aria-label={`Couleur de la photo ${pending.file.name}`}
                          value={pending.color_id}
                          onChange={(event) => {
                            const colorId = event.target.value;
                            linkPhotoColor(colorId);
                            setPendingImages((current) =>
                              current.map((item) =>
                                item.localId === pending.localId
                                  ? { ...item, color_id: colorId }
                                  : item,
                              ),
                            );
                          }}
                        >
                          <option value="">
                            Photo commune à toutes les couleurs
                          </option>
                          {colors.map((color) => (
                            <option key={color.id} value={color.id}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="primary-image"
                          checked={
                            primaryImageKey === `pending:${pending.localId}` ||
                            (!primaryImageKey &&
                              !images.length &&
                              pending === pendingImages[0])
                          }
                          onChange={() =>
                            setPrimaryImageKey(`pending:${pending.localId}`)
                          }
                        />{" "}
                        Photo principale
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingImages((current) =>
                          current.filter(
                            (item) => item.localId !== pending.localId,
                          ),
                        );
                        if (primaryImageKey === `pending:${pending.localId}`)
                          setPrimaryImageKey("");
                      }}
                      aria-label="Retirer cette photo"
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))}
              </div>
            </fieldset>
          </div>
          <div className={"editor-tab-panel is-hidden"}>
            <div className="switches">
              <label>
                <input
                  type="checkbox"
                  checked={form.price_visible}
                  onChange={(event) =>
                    update("price_visible", event.target.checked)
                  }
                />
                <span />
                Afficher le prix sur le site
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) =>
                    update("published", event.target.checked)
                  }
                />
                <span />
                Visible dans la boutique
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => update("featured", event.target.checked)}
                />
                <span />
                Afficher parmi les créations phares
              </label>
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <footer>
            <button
              type="button"
              className="button button--light"
              onClick={requestClose}
            >
              Annuler
            </button>
            <button className="button button--dark" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle className="spin" /> Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </footer>
        </form>
      </motion.section>
    </motion.div>
  );
}
