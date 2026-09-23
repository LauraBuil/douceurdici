import { useEffect } from "react";
import type { Product } from "../data";

export const formatProductFormat = (value: string | null | undefined) =>
  value?.trim().replace(/(\d)\s*(g|kg|ml|cl|l)\b/gi, "$1 $2") ?? "";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Douceur d’ici`;
    return () => {
      document.title =
        "Douceur d’ici · Bougies & savons artisanaux des Pyrénées";
    };
  }, [title]);
}

export const productVariantSummary = (product: Product) => {
  const colors = (product.product_colors ?? [])
    .map((link) => link.color?.name)
    .filter(Boolean);
  const fragrances = (product.product_fragrances ?? [])
    .map((link) => link.fragrance?.name)
    .filter(Boolean);
  return (
    [
      fragrances.length ? fragrances.join(", ") : null,
      colors.length ? colors.join(", ") : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—"
  );
};

export const productStockTotal = (product: Product) => {
  const variants = product.product_variants ?? [];
  return variants.length
    ? variants.reduce((total, variant) => total + Math.max(0, variant.stock), 0)
    : Math.max(0, Number(product.stock) || 0);
};
