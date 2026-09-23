import { useEffect, useRef, useState } from "react";
import { Leaf, Search } from "lucide-react";
import {
  productCategoryLabel,
  productCategoryRecords,
  type CatalogCategory,
} from "../data";
import { supabase } from "../lib/supabase";
import {
  catalogueReturnPosition,
  clearCatalogueReturnPosition,
  currentPathWithSearch,
  navigate,
} from "../lib/navigation";
import { normalizeCategorySlug, usePublicProducts } from "../lib/catalog";
import { useDocumentTitle } from "../lib/formatters";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { ProductCard } from "../components/products/ProductCard";
export function Catalogue() {
  useDocumentTitle("Catalogue artisanal");
  const products = usePublicProducts();
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollRestored = useRef(false);
  const filter = normalizeCategorySlug(
    new URLSearchParams(window.location.search).get("categorie") ?? "tous",
  );
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("catalog_categories")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) =>
        setCatalogCategories((data ?? []) as CatalogCategory[]),
      );
  }, []);
  const productCategories = products.flatMap(productCategoryRecords);
  const categories = catalogCategories.length
    ? catalogCategories
    : [
        ...new Map(
          productCategories.map((category) => [category.id, category]),
        ).values(),
      ];
  useEffect(() => {
    const savedScroll = Number(catalogueReturnPosition?.scrollY);
    if (
      scrollRestored.current ||
      catalogueReturnPosition?.path !== currentPathWithSearch() ||
      !products.length ||
      (Boolean(supabase) && !catalogCategories.length) ||
      !Number.isFinite(savedScroll)
    )
      return;
    scrollRestored.current = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, behavior: "auto" });
        clearCatalogueReturnPosition();
        window.history.scrollRestoration = "auto";
      }),
    );
  }, [products.length, catalogCategories.length]);
  const roots = categories.filter((category) => !category.parent_id);
  const selectedCategory = categories.find(
    (category) => category.slug === filter,
  );
  const selectedRoot = selectedCategory?.parent_id
    ? roots.find((category) => category.id === selectedCategory.parent_id)
    : selectedCategory;
  const children = selectedRoot
    ? categories.filter((category) => category.parent_id === selectedRoot.id)
    : [];
  const filteredByCategory =
    filter === "tous"
      ? products
      : products.filter((product) => {
          const linkedCategories = productCategoryRecords(product);
          if (!selectedCategory)
            return (
              product.category === filter ||
              linkedCategories.some((category) => category.slug === filter)
            );
          if (selectedCategory.parent_id)
            return linkedCategories.some(
              (category) => category.id === selectedCategory.id,
            );
          return (
            product.category === selectedCategory.slug ||
            linkedCategories.some(
              (category) =>
                category.id === selectedCategory.id ||
                category.parent_id === selectedCategory.id,
            )
          );
        });
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const filtered = normalizedSearch
    ? filteredByCategory.filter((product) =>
        [
          product.name,
          product.short_description,
          productCategoryLabel(product),
        ].some((value) =>
          value.toLocaleLowerCase("fr").includes(normalizedSearch),
        ),
      )
    : filteredByCategory;
  const visibleProducts = filtered.slice(0, visibleCount);
  const chooseFilter = (slug: string) => {
    setVisibleCount(12);
    navigate(
      slug === "tous"
        ? "/catalogue"
        : `/catalogue?categorie=${encodeURIComponent(slug)}`,
      {},
      "preserve",
    );
  };
  return (
    <>
      <Header />
      <main className="catalogue-page">
        <section className="catalogue-hero">
          <span className="eyebrow">La boutique</span>
          <h1>Mes créations artisanales</h1>
          <p>
            Des bougies, savons, coffrets, fondants et diffuseurs préparés en
            petites séries dans les Pyrénées.
          </p>
        </section>
        <section className="catalogue-content section-shell">
          <div className="catalogue-toolbar">
            <label>
              <Search />
              <span className="sr-only">Rechercher une création</span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(12);
                }}
                placeholder="Rechercher une création…"
              />
            </label>
            <p aria-live="polite">
              {filtered.length} création{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="catalogue-filter-bar">
            <div
              className="filters"
              role="group"
              aria-label="Filtrer le catalogue"
            >
              <button
                className={filter === "tous" ? "active" : ""}
                aria-pressed={filter === "tous"}
                onClick={() => chooseFilter("tous")}
              >
                Tout
              </button>
              {roots.map((category) => (
                <button
                  key={category.id}
                  className={selectedRoot?.id === category.id ? "active" : ""}
                  aria-pressed={selectedRoot?.id === category.id}
                  onClick={() => chooseFilter(category.slug)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            {children.length > 0 && (
              <div
                className="subfilters"
                role="group"
                aria-label={`Sous-catégories de ${selectedRoot?.name}`}
              >
                <button
                  className={filter === selectedRoot?.slug ? "active" : ""}
                  aria-pressed={filter === selectedRoot?.slug}
                  onClick={() => chooseFilter(selectedRoot!.slug)}
                >
                  Toute la collection
                </button>
                {children.map((category) => (
                  <button
                    key={category.id}
                    className={filter === category.slug ? "active" : ""}
                    aria-pressed={filter === category.slug}
                    onClick={() => chooseFilter(category.slug)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filtered.length ? (
            <>
              <div className="product-grid product-grid--catalogue">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {visibleProducts.length < filtered.length && (
                <button
                  className="button button--light catalogue-more"
                  onClick={() => setVisibleCount((count) => count + 12)}
                >
                  Voir plus de créations
                </button>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Leaf />
              <h2>
                {normalizedSearch
                  ? "Aucune création trouvée."
                  : "Cette collection arrive bientôt."}
              </h2>
              <p>
                {normalizedSearch
                  ? "Essayez un autre nom ou une autre collection."
                  : "De nouvelles créations sont en préparation à l’atelier."}
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
