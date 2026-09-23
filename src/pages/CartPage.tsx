import { useEffect } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { CartItemRow } from "../components/cart/CartItemRow";
import { CartSummary } from "../components/cart/CartSummary";
import { useCart } from "../components/cart/useCart";
import { usePublicProducts } from "../lib/catalog";
import { Footer } from "../components/site/Footer";
import { Header } from "../components/site/Header";
import { navigate } from "../lib/navigation";
import { useDocumentTitle } from "../lib/formatters";

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, syncItemsWithProducts } =
    useCart();
  const products = usePublicProducts();
  useDocumentTitle("Panier");

  useEffect(() => {
    if (products.length > 0) syncItemsWithProducts(products);
  }, [products, syncItemsWithProducts]);
  return (
    <>
      <Header />
      <main className="cart-page">
        <header className="page-heading">
          <span className="eyebrow">Votre sélection</span>
          <h1>Panier</h1>
          <p>Retrouvez ici les créations que vous souhaitez commander.</p>
        </header>
        {items.length === 0 ? (
          <section className="cart-empty">
            <ShoppingBag />
            <h2>Votre panier est vide.</h2>
            <p>
              Découvrez les créations artisanales disponibles à la commande.
            </p>
            <button
              className="button button--dark"
              type="button"
              onClick={() => navigate("/catalogue")}
            >
              <ArrowLeft size={16} /> Voir le catalogue
            </button>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Articles du panier">
              {items.map((item) => (
                <CartItemRow
                  key={item.key}
                  item={item}
                  onQuantityChange={(quantity) =>
                    updateQuantity(item.key, quantity)
                  }
                  onRemove={() => removeItem(item.key)}
                />
              ))}
            </section>
            <CartSummary subtotal={subtotal} items={items} />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
