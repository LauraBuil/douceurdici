import { useEffect, useRef, useState } from "react";
import { demoProducts, type CatalogCategory, type Product } from "../data";
import { supabase } from "./supabase";
import {
  catalogueReturnPosition,
  clearCatalogueReturnPosition,
  currentPathWithSearch,
} from "./navigation";

export const productSelect =
  "*, category_record:catalog_categories!products_category_id_fkey(*), product_categories(category_id,category:catalog_categories!product_categories_category_id_fkey(*)), product_colors(color_id,color:catalog_colors(*)), product_fragrances(fragrance_id,fragrance:catalog_fragrances(*)), product_images(*), product_variants(*)";

const categoryAliases: Record<string, string> = {
  bougies: "bougie",
  savons: "savon",
  coffrets: "coffret",
  fondants: "fondant",
  diffuseurs: "diffuseur",
  parfums: "diffuseur",
};

export const normalizeCategorySlug = (slug: string) =>
  categoryAliases[slug] ?? slug;

export function usePublicProducts() {
  const [products, setProducts] = useState<Product[]>(
    supabase ? [] : demoProducts,
  );

  useEffect(() => {
    if (!supabase) return;

    supabase
      .from("products")
      .select(productSelect)
      .eq("published", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) {
          console.error(
            "[catalogue] Chargement des produits impossible",
            error,
          );
          return;
        }

        setProducts((data ?? []) as Product[]);
      });
  }, []);

  return products;
}

export function useCatalogueScrollRestoration(
  products: Product[],
  categories: CatalogCategory[],
) {
  const scrollRestored = useRef(false);

  useEffect(() => {
    const savedScroll = Number(catalogueReturnPosition?.scrollY);
    const canRestore =
      !scrollRestored.current &&
      catalogueReturnPosition?.path === currentPathWithSearch() &&
      products.length > 0 &&
      (!supabase || categories.length > 0) &&
      Number.isFinite(savedScroll);

    if (!canRestore) return;

    scrollRestored.current = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, behavior: "auto" });
        clearCatalogueReturnPosition();
        window.history.scrollRestoration = "auto";
      }),
    );
  }, [products.length, categories.length]);
}
