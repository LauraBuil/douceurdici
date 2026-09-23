import { useState } from "react";
import {
  FolderTree,
  Palette,
  ShoppingCart,
  SprayCan,
  Users,
} from "lucide-react";
import { CategorySettings } from "./CategorySettings";
import { ColorSettings } from "./ColorSettings";
import { FragranceSettings } from "./FragranceSettings";
import { AccountSettings } from "./AccountSettings";
import { ShopSettings } from "./ShopSettings";
import type { SettingsTab } from "./SettingsTypes";

export function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>("categories");
  const tabs = [
    { id: "categories" as const, label: "Catégories", icon: FolderTree },
    { id: "colors" as const, label: "Couleurs", icon: Palette },
    { id: "fragrances" as const, label: "Parfums", icon: SprayCan },
    { id: "accounts" as const, label: "Comptes", icon: Users },
    { id: "shop" as const, label: "Boutique", icon: ShoppingCart },
  ];
  return (
    <div className="settings-shell">
      <nav className="settings-tabs" aria-label="Réglages du catalogue">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
      {tab === "categories" && <CategorySettings />}
      {tab === "colors" && <ColorSettings />}
      {tab === "fragrances" && <FragranceSettings />}
      {tab === "accounts" && <AccountSettings />}
      {tab === "shop" && <ShopSettings />}
    </div>
  );
}
