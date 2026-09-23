import { ShoppingBag } from "lucide-react";
import { AppLink } from "../site/AppLink";
import { useCart } from "./useCart";

export function CartButton() {
  const { itemCount } = useCart();
  return (
    <AppLink className="shop-button" href="/panier">
      <ShoppingBag size={17} />
      <span>Panier</span>
      {itemCount > 0 && <b className="cart-link-count">{itemCount}</b>}
    </AppLink>
  );
}
