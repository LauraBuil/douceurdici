import { useEffect, useMemo, useState, type ReactNode } from "react";
import { productPrimaryImage, type Product } from "../../data";
import { CartContext, type CartContextValue } from "./CartContextValue";
import type { CartItem } from "./CartTypes";

const STORAGE_KEY = "douceur-dici-cart";

function readStoredCart() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function clampQuantity(quantity: number, maxQuantity: number) {
  return Math.min(Math.max(Math.round(quantity), 1), maxQuantity);
}

function getProductAvailability(stock: number) {
  const normalizedStock = Number(stock) || 0;
  return {
    stock: normalizedStock,
    isPreorder: normalizedStock <= 0,
    maxQuantity: normalizedStock > 0 ? normalizedStock : 10,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
      addItem: ({ product, quantity, color, fragrance, variantId }) => {
        const selectedVariant = (product.product_variants ?? []).find(
          (variant) => variant.id === variantId,
        );
        const availability = getProductAvailability(
          selectedVariant?.stock ?? product.stock,
        );
        const colorSnapshot = color
          ? { id: color.id, name: color.name, hex_code: color.hex_code }
          : null;
        const fragranceSnapshot = fragrance
          ? { id: fragrance.id, name: fragrance.name }
          : null;
        const key = `${product.id}:${color?.id ?? "default"}:${fragrance?.id ?? "default"}`;
        setItems((currentItems) => {
          const existingItem = currentItems.find((item) => item.key === key);
          if (existingItem) {
            return currentItems.map((item) =>
              item.key === key
                ? {
                    ...item,
                    price: Number(product.price),
                    priceVisible: product.price_visible,
                    quantity: clampQuantity(
                      item.quantity + quantity,
                      availability.maxQuantity,
                    ),
                    maxQuantity: availability.maxQuantity,
                    isPreorder: availability.isPreorder,
                    imageUrl: productPrimaryImage(product),
                    color: colorSnapshot,
                    fragrance: fragranceSnapshot,
                    variantId: variantId ?? null,
                  }
                : item,
            );
          }
          return [
            ...currentItems,
            {
              key,
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: Number(product.price),
              priceVisible: product.price_visible,
              quantity: clampQuantity(quantity, availability.maxQuantity),
              maxQuantity: availability.maxQuantity,
              isPreorder: availability.isPreorder,
              imageUrl: productPrimaryImage(product),
              variantId: variantId ?? null,
              color: colorSnapshot,
              fragrance: fragranceSnapshot,
            },
          ];
        });
      },
      updateQuantity: (key, quantity) => {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.key === key
              ? {
                  ...item,
                  quantity: clampQuantity(quantity, item.maxQuantity),
                }
              : item,
          ),
        );
      },
      removeItem: (key) => {
        setItems((currentItems) =>
          currentItems.filter((item) => item.key !== key),
        );
      },
      clearCart: () => setItems([]),
      syncItemsWithProducts: (products: Product[]) => {
        setItems((currentItems) => {
          let hasChanged = false;
          const nextItems = currentItems.map((item) => {
            const product = products.find(
              (entry) => entry.id === item.productId,
            );
            if (!product) return item;

            const selectedVariant = (product.product_variants ?? []).find(
              (variant) => variant.id === item.variantId,
            );
            const availability = getProductAvailability(
              selectedVariant?.stock ?? product.stock,
            );
            const nextItem = {
              ...item,
              price: Number(product.price),
              priceVisible: product.price_visible,
              quantity: clampQuantity(item.quantity, availability.maxQuantity),
              maxQuantity: availability.maxQuantity,
              isPreorder: availability.isPreorder,
              imageUrl: productPrimaryImage(product),
            };
            if (
              item.price !== nextItem.price ||
              item.priceVisible !== nextItem.priceVisible ||
              item.quantity !== nextItem.quantity ||
              item.maxQuantity !== nextItem.maxQuantity ||
              item.isPreorder !== nextItem.isPreorder ||
              item.imageUrl !== nextItem.imageUrl
            ) {
              hasChanged = true;
            }
            return nextItem;
          });
          return hasChanged ? nextItems : currentItems;
        });
      },
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
