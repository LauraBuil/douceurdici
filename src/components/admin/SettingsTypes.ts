export type SettingsTab =
  | "categories"
  | "colors"
  | "fragrances"
  | "accounts"
  | "shop";
export type CategoryKind = "root" | "child";
export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
export const linkedItemMessage =
  "Cet élément est encore utilisé. Retirez-le d’abord des produits ou des sous-catégories concernés.";
