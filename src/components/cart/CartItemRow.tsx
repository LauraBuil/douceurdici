import { Trash2 } from "lucide-react";
import { formatPrice } from "../../data";
import { navigate } from "../../lib/navigation";
import type { CartItem } from "./CartTypes";

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <article className="cart-item">
      <button
        className="cart-item-image"
        type="button"
        onClick={() => navigate(`/produit/${item.slug}`)}
        aria-label={`Voir ${item.name}`}
      >
        <img src={item.imageUrl} alt={item.name} />
      </button>
      <div className="cart-item-details">
        <span
          className={`status ${item.isPreorder ? "status--preorder" : "status--published"}`}
        >
          {item.isPreorder ? "Précommande" : "En stock"}
        </span>
        <h2>{item.name}</h2>
        {item.color && (
          <p className="cart-item-color">
            <span style={{ backgroundColor: item.color.hex_code }} />
            {item.color.name}
          </p>
        )}
        {item.fragrance && (
          <p className="cart-item-fragrance">Parfum : {item.fragrance.name}</p>
        )}
        <strong>{formatPrice(item.price)}</strong>
      </div>
      <div className="cart-item-actions">
        <label>
          Quantité
          <select
            value={item.quantity}
            onChange={(event) => onQuantityChange(Number(event.target.value))}
          >
            {Array.from({ length: item.maxQuantity }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
        <strong>{formatPrice(item.price * item.quantity)}</strong>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer ${item.name}`}
        >
          <Trash2 />
        </button>
      </div>
    </article>
  );
}
