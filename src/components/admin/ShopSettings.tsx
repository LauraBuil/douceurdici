import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { SettingsPanel } from "./SettingsPanel";

export function ShopSettings() {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase!
      .from("site_settings")
      .select("boolean_value")
      .eq("id", "cart_enabled")
      .single()
      .then(({ data }) => setEnabled(Boolean(data?.boolean_value)));
  }, []);
  const update = async (value: boolean) => {
    setSaving(true);
    const { error } = await supabase!
      .from("site_settings")
      .upsert({ id: "cart_enabled", boolean_value: value });
    if (!error) setEnabled(value);
    setSaving(false);
  };
  return (
    <SettingsPanel
      title="Boutique en ligne"
      description="Préparez les fonctions commerciales sans les rendre visibles trop tôt."
    >
      <section className="admin-shop-setting">
        <ShoppingCart />
        <div>
          <h2>Panier du site</h2>
          <p>
            Laissez-le désactivé tant que la vente en ligne n’est pas ouverte.
          </p>
        </div>
        <label className="admin-switch">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(event) => void update(event.target.checked)}
          />
          <span />
          <strong>
            {saving
              ? "Enregistrement…"
              : enabled
                ? "Panier activé"
                : "Panier désactivé"}
          </strong>
        </label>
      </section>
    </SettingsPanel>
  );
}
