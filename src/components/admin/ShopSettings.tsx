import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { SettingsPanel } from "./SettingsPanel";

export function ShopSettings() {
  const [enabled, setEnabled] = useState(false);
  const [shippingRate, setShippingRate] = useState("0");
  const [shippingRateDraft, setShippingRateDraft] = useState("0");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([
      supabase!.from("site_settings").select("boolean_value").eq("id", "cart_enabled").single(),
      supabase!.from("site_settings").select("numeric_value").eq("id", "shipping_rate").single(),
    ]).then(([cartResult, shippingResult]) => {
      setEnabled(Boolean(cartResult.data?.boolean_value));
      const value = Number(shippingResult.data?.numeric_value ?? 0).toFixed(2);
      setShippingRate(value);
      setShippingRateDraft(value);
    });
  }, []);
  const update = async (value: boolean) => {
    setSaving(true);
    const { error } = await supabase!
      .from("site_settings")
      .upsert({ id: "cart_enabled", boolean_value: value });
    if (!error) setEnabled(value);
    setSaving(false);
  };
  const updateShippingRate = async () => {
    const value = Number(shippingRateDraft.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) return;
    setSaving(true);
    const { error } = await supabase!
      .from("site_settings")
      .upsert({ id: "shipping_rate", numeric_value: value });
    if (!error) {
      const nextValue = value.toFixed(2);
      setShippingRate(nextValue);
      setShippingRateDraft(nextValue);
    }
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
      <section className="admin-shop-setting admin-shop-setting--shipping">
        <div>
          <h2>Frais de livraison</h2>
          <p>Ce montant sera ajouté au total de chaque commande.</p>
        </div>
        <label className="admin-shipping-rate">
          Tarif en euros
          <input
            type="number"
            min="0"
            step="0.01"
            value={shippingRateDraft}
            onChange={(event) => setShippingRateDraft(event.target.value)}
          />
        </label>
        <button
          className="button button--dark"
          type="button"
          disabled={saving || shippingRateDraft === shippingRate}
          onClick={() => void updateShippingRate()}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </section>
    </SettingsPanel>
  );
}
