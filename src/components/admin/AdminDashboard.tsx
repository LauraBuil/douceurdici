import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Image as ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PackagePlus,
  Pencil,
  Search,
  Settings,
  ShoppingBag,
  ClipboardList,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  formatPrice,
  productCategoryLabel,
  productPrimaryImage,
  type Product,
  type StaffRole,
} from "../../data";
import { supabase } from "../../lib/supabase";
import { navigate } from "../../lib/navigation";
import { productSelect } from "../../lib/catalog";
import { productStockTotal, productVariantSummary } from "../../lib/formatters";
import { Logo } from "../site/Logo";
import { AdminGallery } from "./AdminGallery";
import { AdminMarkets } from "./AdminMarkets";
import { AdminOverview } from "./AdminOverview";
import type { AdminView } from "./AdminTypes";
import { AdminSettings } from "./AdminSettings";
import { ProductEditor } from "./ProductEditor";
import { AdminOrders } from "./AdminOrders";
export function AdminDashboard({
  email,
  role,
}: {
  email: string;
  role: StaffRole;
}) {
  const [view, setView] = useState<AdminView>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null | "new">(null);
  const [notice, setNotice] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productStatus, setProductStatus] = useState<
    "all" | "published" | "draft"
  >("all");
  const loadProducts = async () => {
    const { data } = await supabase!
      .from("products")
      .select(productSelect)
      .order("sort_order");
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };
  useEffect(() => {
    void supabase!
      .from("products")
      .select(productSelect)
      .order("sort_order")
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = (error: unknown) =>
      console.warn("WebMCP tool registration failed", error);
    void Promise.resolve(
      context.registerTool(
        {
          name: "list_catalog_products",
          title: "Lister les créations",
          description:
            "Liste les créations visibles dans l’administration du catalogue Douceur d’ici.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          async execute() {
            const { data, error } = await supabase!
              .from("products")
              .select(
                "id,name,category,category_id,price,price_visible,published,featured,product_categories(category_id),product_colors(color_id),product_fragrances(fragrance_id),product_images(image_url,color_id)",
              )
              .order("sort_order");
            if (error) throw new Error("Le catalogue est indisponible.");
            return { products: data };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(report);
    void Promise.resolve(
      context.registerTool(
        {
          name: "add_catalog_product",
          title: "Ajouter une création",
          description:
            "Ajoute une création au catalogue avec les mêmes autorisations que le formulaire administrateur.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 2, maxLength: 120 },
              category_ids: {
                type: "array",
                minItems: 1,
                items: { type: "string", minLength: 36, maxLength: 36 },
                uniqueItems: true,
              },
              short_description: { type: "string" },
              description: { type: "string" },
              price: { type: "number", minimum: 0 },
              stock: { type: "integer", minimum: 0 },
              weight: { type: "string" },
              price_visible: { type: "boolean" },
              image_url: { type: "string" },
              published: { type: "boolean" },
              featured: { type: "boolean" },
              color_ids: {
                type: "array",
                items: { type: "string" },
                uniqueItems: true,
              },
              fragrance_ids: {
                type: "array",
                items: { type: "string" },
                uniqueItems: true,
              },
            },
            required: [
              "name",
              "category_ids",
              "short_description",
              "description",
              "price",
            ],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          async execute(input) {
            if (!input || typeof input !== "object")
              throw new Error(
                "Les informations de la création sont invalides.",
              );
            const value = input as Record<string, unknown>;
            const categoryIds = Array.isArray(value.category_ids)
              ? value.category_ids.filter(
                  (id): id is string => typeof id === "string",
                )
              : [];
            if (
              typeof value.name !== "string" ||
              value.name.trim().length < 2 ||
              !categoryIds.length ||
              typeof value.price !== "number" ||
              value.price < 0 ||
              typeof value.short_description !== "string" ||
              typeof value.description !== "string"
            )
              throw new Error("Les champs obligatoires sont invalides.");
            const slug = value.name
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            const { data: availableCategories } = await supabase!
              .from("catalog_categories")
              .select("id,slug,parent_id")
              .in("id", categoryIds);
            if (
              !availableCategories ||
              availableCategories.length !== categoryIds.length
            )
              throw new Error("Une catégorie sélectionnée est invalide.");
            const category = availableCategories.find(
              (item) => item.id === categoryIds[0],
            )!;
            const { data: parent } = category.parent_id
              ? await supabase!
                  .from("catalog_categories")
                  .select("slug")
                  .eq("id", category.parent_id)
                  .single()
              : { data: null };
            const { data, error } = await supabase!
              .from("products")
              .insert({
                name: value.name.trim(),
                slug,
                category: parent?.slug ?? category.slug,
                category_id: category.id,
                short_description: value.short_description,
                description: value.description,
                price: value.price,
                stock:
                  typeof value.stock === "number" && value.stock >= 0
                    ? Math.floor(value.stock)
                    : 0,
                price_visible: value.price_visible !== false,
                weight: typeof value.weight === "string" ? value.weight : null,
                image_url:
                  typeof value.image_url === "string" ? value.image_url : "",
                published: value.published !== false,
                featured: value.featured === true,
              })
              .select("id,name,slug")
              .single();
            if (error) throw new Error("La création n’a pas pu être ajoutée.");
            const colors = Array.isArray(value.color_ids)
              ? value.color_ids.filter(
                  (id): id is string => typeof id === "string",
                )
              : [];
            const fragrances = Array.isArray(value.fragrance_ids)
              ? value.fragrance_ids.filter(
                  (id): id is string => typeof id === "string",
                )
              : [];
            const results = await Promise.all([
              supabase!.from("product_categories").insert(
                categoryIds.map((category_id) => ({
                  product_id: data.id,
                  category_id,
                })),
              ),
              colors.length
                ? supabase!.from("product_colors").insert(
                    colors.map((color_id) => ({
                      product_id: data.id,
                      color_id,
                    })),
                  )
                : Promise.resolve({ error: null }),
              fragrances.length
                ? supabase!.from("product_fragrances").insert(
                    fragrances.map((fragrance_id) => ({
                      product_id: data.id,
                      fragrance_id,
                    })),
                  )
                : Promise.resolve({ error: null }),
            ]);
            if (results.some((result) => result.error)) {
              await supabase!.from("products").delete().eq("id", data.id);
              throw new Error(
                "Les options de la création n’ont pas pu être ajoutées.",
              );
            }
            await loadProducts();
            setNotice("Catalogue mis à jour.");
            return { product: data, status: "created" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(report);
    return () => lifecycle.abort();
  }, []);
  const remove = async (product: Product) => {
    if (!window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) return;
    const { error } = await supabase!
      .from("products")
      .delete()
      .eq("id", product.id);
    if (error) setNotice("La création n’a pas pu être supprimée.");
    else {
      setNotice("Création supprimée.");
      loadProducts();
    }
  };
  const labels: Record<AdminView, { title: string; description: string }> = {
    overview: {
      title: "Tableau de bord",
      description: "Gérez le contenu visible sur votre site.",
    },
    products: {
      title: "Produits",
      description: `${products.length} création${products.length > 1 ? "s" : ""} enregistrée${products.length > 1 ? "s" : ""}`,
    },
    orders: {
      title: "Commandes",
      description: "Suivez les commandes payées et les précommandes.",
    },
    gallery: {
      title: "Galerie photos",
      description: "Ajoutez et organisez les images présentées sur le site.",
    },
    markets: {
      title: "Calendrier des marchés",
      description: "Planifiez les prochaines dates où vous rencontrer.",
    },
    settings: {
      title: "Paramètres",
      description:
        "Gérez les catégories, couleurs, parfums, comptes et options de la boutique.",
    },
  };
  const navItems: {
    id: AdminView;
    label: string;
    icon: typeof LayoutDashboard;
  }[] = [
    { id: "overview", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "products", label: "Produits", icon: ShoppingBag },
    { id: "orders", label: "Commandes", icon: ClipboardList },
    { id: "gallery", label: "Galerie photos", icon: ImageIcon },
    { id: "markets", label: "Calendrier des marchés", icon: CalendarDays },
    ...(role === "admin"
      ? [{ id: "settings" as const, label: "Paramètres", icon: Settings }]
      : []),
  ];
  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase("fr");
  const visibleAdminProducts = products.filter(
    (product) =>
      (!normalizedProductSearch ||
        product.name
          .toLocaleLowerCase("fr")
          .includes(normalizedProductSearch)) &&
      (productStatus === "all" ||
        (productStatus === "published"
          ? product.published
          : !product.published)),
  );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo compact />
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
            >
              <Icon /> {label}
            </button>
          ))}
          <button onClick={() => navigate("/")}>
            <ArrowRight /> Voir le site
          </button>
        </nav>
        <div className="admin-account">
          <small>{role === "admin" ? "Administrateur" : "Exploitant"}</small>
          <span>{email}</span>
          <button onClick={() => supabase!.auth.signOut()}>
            <LogOut /> Se déconnecter
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header>
          <div>
            <span className="eyebrow">Administration</span>
            <h1>{labels[view].title}</h1>
            <p>{labels[view].description}</p>
          </div>
          {view === "products" && (
            <button
              className="button button--dark"
              onClick={() => setEditing("new")}
            >
              <PackagePlus /> Ajouter un produit
            </button>
          )}
        </header>
        {notice && view === "products" && (
          <div className="admin-notice" role="status">
            <Check />
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Fermer le message"
            >
              <X />
            </button>
          </div>
        )}
        <div className="admin-view">
          {view === "overview" && (
            <AdminOverview productCount={products.length} onOpen={setView} />
          )}
          {view === "products" &&
            (loading ? (
              <div className="admin-loading-inline">
                <LoaderCircle className="spin" /> Chargement du catalogue…
              </div>
            ) : (
              <>
                <div className="admin-product-toolbar">
                  <label>
                    <Search />
                    <span className="sr-only">Rechercher un produit</span>
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Rechercher un produit…"
                    />
                  </label>
                  <label>
                    Visibilité
                    <select
                      value={productStatus}
                      onChange={(event) =>
                        setProductStatus(
                          event.target.value as typeof productStatus,
                        )
                      }
                    >
                      <option value="all">Tous les produits</option>
                      <option value="published">En ligne</option>
                      <option value="draft">Brouillons</option>
                    </select>
                  </label>
                  <p>
                    {visibleAdminProducts.length} résultat
                    {visibleAdminProducts.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Parfums & couleurs</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Visibilité</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAdminProducts.map((product) => {
                        const stockTotal = productStockTotal(product);
                        return (
                          <tr key={product.id}>
                            <td>
                              <div className="table-product">
                                <img
                                  src={productPrimaryImage(product)}
                                  alt=""
                                  loading="lazy"
                                />
                                <div>
                                  <strong>{product.name}</strong>
                                  <small>
                                    {productCategoryLabel(product)} ·{" "}
                                    {(product.product_images ?? []).length}{" "}
                                    photo
                                    {(product.product_images ?? []).length > 1
                                      ? "s"
                                      : ""}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>{productVariantSummary(product)}</td>
                            <td>
                              {product.price_visible ? (
                                formatPrice(Number(product.price))
                              ) : (
                                <span className="status">Prix masqué</span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`status ${stockTotal > 0 ? "status--published" : "status--preorder"}`}
                              >
                                {stockTotal > 0
                                  ? `${stockTotal} en stock`
                                  : "Précommande"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={
                                  product.published
                                    ? "status status--published"
                                    : "status"
                                }
                              >
                                {product.published ? "En ligne" : "Brouillon"}
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  onClick={() => setEditing(product)}
                                  aria-label={`Modifier ${product.name}`}
                                >
                                  <Pencil />
                                </button>
                                <button
                                  onClick={() => remove(product)}
                                  aria-label={`Supprimer ${product.name}`}
                                >
                                  <Trash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!visibleAdminProducts.length && (
                    <div className="empty-state">
                      <Search />
                      <h2>Aucun produit trouvé.</h2>
                      <p>Modifiez la recherche ou le filtre de visibilité.</p>
                    </div>
                  )}
                </div>
              </>
            ))}
          {view === "orders" && <AdminOrders />}
          {view === "gallery" && <AdminGallery />}
          {view === "markets" && <AdminMarkets />}
          {view === "settings" && role === "admin" && <AdminSettings />}
        </div>
      </main>
      <AnimatePresence>
        {editing && (
          <ProductEditor
            product={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              setNotice("Catalogue mis à jour.");
              loadProducts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
