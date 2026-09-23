import {
  formatPrice,
  productCategoryLabel,
  productPrimaryImage,
  type CatalogColor,
  type CatalogFragrance,
  type Product,
} from "../../data";
import {
  currentPathWithSearch,
  navigate,
  rememberCataloguePosition,
} from "../../lib/navigation";
import { formatProductFormat } from "../../lib/formatters";
export function ProductCard({ product }: { product: Product }) {
  const colors = (product.product_colors ?? [])
    .map((link) => link.color)
    .filter(Boolean) as CatalogColor[];
  const fragrances = (product.product_fragrances ?? [])
    .map((link) => link.fragrance)
    .filter(Boolean) as CatalogFragrance[];
  const fragranceSummary =
    fragrances.length === 1
      ? fragrances[0].name
      : fragrances.length > 1
        ? `${fragrances.length} parfums au choix`
        : null;
  const details = [fragranceSummary, formatProductFormat(product.weight)]
    .filter(Boolean)
    .join(" · ");
  const fromCatalogue = window.location.pathname.startsWith("/catalogue");
  const cataloguePath = fromCatalogue ? currentPathWithSearch() : "/catalogue";
  const openProduct = () => {
    if (fromCatalogue) {
      window.history.scrollRestoration = "manual";
      rememberCataloguePosition(cataloguePath, window.scrollY);
    }
    navigate(`/produit/${product.slug}`, { cataloguePath });
  };
  return (
    <article className="product-card">
      <button
        className="product-card-link"
        onClick={openProduct}
        aria-label={`Voir ${product.name}`}
      >
        <div className="product-image-wrap">
          <img
            src={productPrimaryImage(product)}
            alt={product.name}
            loading="lazy"
          />
          <span>{productCategoryLabel(product)}</span>
        </div>
        <div className="product-info">
          <div>
            <h3>{product.name}</h3>
            <p>{details || product.short_description}</p>
            {colors.length > 0 && (
              <span
                className="mini-swatches"
                aria-label={`${colors.length} couleurs disponibles`}
              >
                {colors.slice(0, 6).map((color) => (
                  <i
                    key={color.id}
                    style={{ backgroundColor: color.hex_code }}
                    title={color.name}
                  />
                ))}
                {colors.length > 6 && <small>+{colors.length - 6}</small>}
              </span>
            )}
          </div>
          {product.price_visible && (
            <strong>{formatPrice(Number(product.price))}</strong>
          )}
        </div>
        <span
          className={`product-stock-badge ${product.stock > 0 ? "is-available" : "is-preorder"}`}
        >
          {product.stock > 0 ? "En stock" : "Précommande"}
        </span>
      </button>
    </article>
  );
}
