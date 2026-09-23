import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Leaf, LoaderCircle } from "lucide-react";
import {
  demoProducts,
  productCategoryLabel,
  productPrimaryImage,
  type CatalogColor,
  type CatalogFragrance,
  type Product,
} from "../data";
import { supabase } from "../lib/supabase";
import { navigate } from "../lib/navigation";
import { productSelect } from "../lib/catalog";
import { formatProductFormat, useDocumentTitle } from "../lib/formatters";
import { formatPrice } from "../data";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { FragranceComposition } from "../components/products/FragranceComposition";
import { ProductDescription } from "../components/products/ProductDescription";
import { useCart } from "../components/cart/useCart";
export function ProductDetailPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(
    demoProducts.find((item) => item.slug === slug) ?? null,
  );
  const [loading, setLoading] = useState(Boolean(supabase));
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFragrance, setSelectedFragrance] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");
  const { addItem } = useCart();
  useDocumentTitle(product?.name ?? "Création artisanale");
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("products")
      .select(productSelect)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as Product | null);
        setLoading(false);
      });
  }, [slug]);
  useEffect(() => {
    if (!product) return;
    const availableColors = (product.product_colors ?? []).map(
      (link) => link.color_id,
    );
    const availableFragrances = (product.product_fragrances ?? []).map(
      (link) => link.fragrance_id,
    );
    const timeout = window.setTimeout(() => {
      setSelectedColor(
        availableColors.length === 1 ? availableColors[0] : null,
      );
      setSelectedFragrance(
        availableFragrances.length === 1 ? availableFragrances[0] : null,
      );
      setQuantity(1);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [product]);
  const allImages = useMemo(
    () =>
      product
        ? [...(product.product_images ?? [])].sort(
            (a, b) =>
              Number(b.is_primary) - Number(a.is_primary) ||
              a.sort_order - b.sort_order,
          )
        : [],
    [product],
  );
  const selectedColorImages = selectedColor
    ? allImages.filter((image) => image.color_id === selectedColor)
    : [];
  const imageUrl =
    selectedImage &&
    allImages.some((image) => image.image_url === selectedImage)
      ? selectedImage
      : selectedColorImages[0]?.image_url ||
        allImages[0]?.image_url ||
        (product ? productPrimaryImage(product) : "");
  if (loading)
    return (
      <>
        <Header />
        <main className="product-detail-loading">
          <LoaderCircle className="spin" /> Chargement de la création…
        </main>
        <Footer />
      </>
    );
  if (!product)
    return (
      <>
        <Header />
        <main className="product-detail-loading">
          <Leaf />
          <h1>Cette création n’est pas disponible.</h1>
          <button
            className="button button--dark"
            onClick={() => navigate("/catalogue")}
          >
            Retour au catalogue
          </button>
        </main>
        <Footer />
      </>
    );
  const colors = (product.product_colors ?? [])
    .map((link) => link.color)
    .filter(Boolean) as CatalogColor[];
  const selectedColorRecord = colors.find(
    (color) => color.id === selectedColor,
  );
  const fragrances = (product.product_fragrances ?? [])
    .map((link) => link.fragrance)
    .filter(Boolean) as CatalogFragrance[];
  const selectedFragranceRecord = fragrances.find(
    (fragrance) => fragrance.id === selectedFragrance,
  );
  const cataloguePath =
    typeof window.history.state?.cataloguePath === "string" &&
    window.history.state.cataloguePath.startsWith("/catalogue")
      ? window.history.state.cataloguePath
      : "/catalogue";
  const backToCatalogue = () =>
    window.history.state?.cataloguePath
      ? window.history.back()
      : navigate(cataloguePath);
  const hasVariantMatrix = (product.product_variants ?? []).length > 0;
  const selectionReady =
    colors.length <= 1 && fragrances.length <= 1
      ? true
      : (colors.length === 0 || Boolean(selectedColor)) &&
        (fragrances.length === 0 || Boolean(selectedFragrance));
  const selectedVariant = (product.product_variants ?? []).find(
    (variant) =>
      (variant.color_id ?? null) === selectedColor &&
      (variant.fragrance_id ?? null) === selectedFragrance,
  );
  const currentStock = hasVariantMatrix
    ? (selectedVariant?.stock ?? 0)
    : product.stock;
  const maxQuantity = currentStock > 0 ? currentStock : 10;
  const inStock = selectionReady && currentStock > 0;
  return (
    <>
      <Header />
      <main className="product-detail">
        <button className="product-back" onClick={backToCatalogue}>
          <ChevronLeft /> Retour au catalogue
        </button>
        <div className="product-detail-grid">
          <section className="product-gallery">
            <div className="product-main-image">
              <img
                src={imageUrl}
                alt={
                  selectedColorRecord
                    ? `${product.name}, couleur ${selectedColorRecord.name}`
                    : product.name
                }
              />
            </div>
            {selectedColorRecord && (
              <p className="selected-color-preview">
                <span
                  style={{ backgroundColor: selectedColorRecord.hex_code }}
                />
                Aperçu de la couleur <strong>{selectedColorRecord.name}</strong>
              </p>
            )}
            {allImages.length > 1 && (
              <div
                className="product-thumbnails"
                aria-label="Toutes les photos du produit"
              >
                {allImages.map((image) => {
                  const imageColor = colors.find(
                    (color) => color.id === image.color_id,
                  );
                  return (
                    <button
                      key={image.id}
                      className={image.image_url === imageUrl ? "active" : ""}
                      onClick={() => {
                        setSelectedImage(image.image_url);
                        setSelectedColor(image.color_id ?? null);
                      }}
                      aria-label={`Afficher la photo${imageColor ? `, couleur ${imageColor.name}` : ""}`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || product.name}
                        loading="lazy"
                      />
                      {imageColor && <small>{imageColor.name}</small>}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
          <section className="product-detail-copy">
            <span className="eyebrow">{productCategoryLabel(product)}</span>
            <h1>{product.name}</h1>
            <p className="product-lead">{product.short_description}</p>
            {product.price_visible && (
              <strong className="product-price">
                {formatPrice(Number(product.price))}
              </strong>
            )}
            <ProductDescription description={product.description} />
            <div
              className={`order-box ${inStock ? "is-available" : "is-preorder"}`}
            >
              <div>
                <span className="eyebrow">
                  {!selectionReady
                    ? "Choisissez vos options"
                    : inStock
                      ? "Disponible maintenant"
                      : "Fabrication à la demande"}
                </span>
                <h2>
                  {!selectionReady
                    ? "Choisir une déclinaison"
                    : inStock
                      ? "Commander"
                      : "Précommander"}
                </h2>
                {!selectionReady ? (
                  <p>Sélectionnez une couleur et un parfum pour continuer.</p>
                ) : inStock ? (
                  <p>
                    {currentStock} article{currentStock > 1 ? "s" : ""}{" "}
                    disponible
                    {currentStock > 1 ? "s" : ""} actuellement.
                  </p>
                ) : (
                  <p>
                    Votre commande sera envoyée une fois le produit fabriqué. Un
                    délai supplémentaire est à prévoir.
                  </p>
                )}
              </div>
              {(colors.length > 1 || fragrances.length > 1) && (
                <div className="variant-selectors">
                  {colors.length > 1 && (
                    <label>
                      Couleur
                      <select
                        value={selectedColor ?? ""}
                        onChange={(event) =>
                          setSelectedColor(event.target.value || null)
                        }
                      >
                        <option value="">Choisir une couleur</option>
                        {colors.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {fragrances.length > 1 && (
                    <label>
                      Parfum
                      <select
                        value={selectedFragrance ?? ""}
                        onChange={(event) =>
                          setSelectedFragrance(event.target.value || null)
                        }
                      >
                        <option value="">Choisir un parfum</option>
                        {fragrances.map((fragrance) => (
                          <option key={fragrance.id} value={fragrance.id}>
                            {fragrance.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
              <div className="order-controls">
                <label>
                  Quantité
                  <select
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                  >
                    {Array.from({ length: maxQuantity }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button--dark"
                  type="button"
                  disabled={!selectionReady}
                  onClick={() => {
                    addItem({
                      product,
                      quantity,
                      color: selectedColorRecord,
                      fragrance: selectedFragranceRecord,
                      variantId: selectedVariant?.id ?? null,
                    });
                    setCartNotice(
                      `${quantity} article${quantity > 1 ? "s" : ""} ajouté${quantity > 1 ? "s" : ""} au panier.`,
                    );
                  }}
                >
                  {!selectionReady
                    ? "Choisir les options"
                    : inStock
                      ? "Commander"
                      : "Précommander"}
                </button>
              </div>
              {cartNotice && <p className="cart-notice">{cartNotice}</p>}
            </div>
            {product.weight && (
              <p className="product-format">
                Format : <strong>{formatProductFormat(product.weight)}</strong>
              </p>
            )}
            {colors.length > 0 && (
              <div className="product-options">
                <h2>Couleurs disponibles</h2>
                <p>
                  Choisissez une couleur pour afficher sa photo. Toutes les
                  autres photos restent accessibles sous l’image.
                </p>
                <div className="color-swatches">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      className={selectedColor === color.id ? "active" : ""}
                      onClick={() => {
                        const nextColor =
                          selectedColor === color.id ? null : color.id;
                        setSelectedColor(nextColor);
                        setSelectedImage(
                          nextColor
                            ? (allImages.find(
                                (image) => image.color_id === nextColor,
                              )?.image_url ?? "")
                            : "",
                        );
                      }}
                      aria-label={`Voir la couleur ${color.name}`}
                      aria-pressed={selectedColor === color.id}
                    >
                      <span style={{ backgroundColor: color.hex_code }} />
                      <small>{color.name}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
          {fragrances.length > 0 && (
            <section className="product-fragrances">
              <header>
                <span className="eyebrow">La signature olfactive</span>
                <h2>Parfums & compositions</h2>
                <p>
                  Ouvrez un parfum pour consulter sa composition et ses
                  informations.
                </p>
              </header>
              <div className="fragrance-list fragrance-list--gallery">
                {fragrances.map((fragrance, index) => (
                  <details
                    key={fragrance.id}
                    open={index === 0 ? true : undefined}
                  >
                    <summary className="fragrance-heading">
                      <span className="fragrance-number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong>{fragrance.name}</strong>
                    </summary>
                    <FragranceComposition composition={fragrance.composition} />
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
