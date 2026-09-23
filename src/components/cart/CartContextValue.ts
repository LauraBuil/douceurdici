import { createContext } from "react";
import type { Product } from "../../data";
import type { AddToCartInput, CartItem } from "./CartTypes";

export type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (input: AddToCartInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  syncItemsWithProducts: (products: Product[]) => void;
};

export const CartContext = createContext<CartContextValue | null>(null);
