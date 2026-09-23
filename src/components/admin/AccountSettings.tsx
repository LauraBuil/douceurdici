import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, UserPlus, Users } from "lucide-react";
import type { StaffAccount, StaffRole } from "../../data";
import { supabase } from "../../lib/supabase";
import { SettingsPanel } from "./SettingsPanel";

export function AccountSettings() {
  const [items, setItems] = useState<StaffAccount[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("exploitant");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    const { data } = await supabase!
      .from("admins")
      .select("user_id,email,role,active,created_at")
      .order("created_at");
    setItems((data ?? []) as StaffAccount[]);
  };
  useEffect(() => {
    void supabase!
      .from("admins")
      .select("user_id,email,role,active,created_at")
      .order("created_at")
      .then(({ data }) => setItems((data ?? []) as StaffAccount[]));
  }, []);
  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const { error } = await supabase!.functions.invoke("invite-staff", {
      body: { email, role },
    });
    if (error)
      setNotice(error.message || "L’invitation n’a pas pu être envoyée.");
    else {
      setEmail("");
      setNotice(
        "Invitation envoyée. Le compte apparaît maintenant dans la liste.",
      );
      await load();
    }
    setSaving(false);
  };
  return (
    <SettingsPanel
      title="Comptes de l’équipe"
      description="Invitez une personne et choisissez précisément son niveau d’accès."
    >
      <form className="settings-add-form" onSubmit={invite}>
        <label>
          Adresse e-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Rôle
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
          >
            <option value="exploitant">Exploitant — contenu du site</option>
            <option value="admin">Administrateur — tous les réglages</option>
          </select>
        </label>
        <button className="button button--dark" disabled={saving}>
          {saving ? <LoaderCircle className="spin" /> : <UserPlus />} Inviter
        </button>
      </form>
      {notice && <p className="settings-notice">{notice}</p>}
      <div className="settings-list">
        {items.map((item) => (
          <article
            key={item.user_id}
            className={!item.active ? "inactive" : ""}
          >
            <Users />
            <div>
              <strong>{item.email ?? "Adresse indisponible"}</strong>
              <small>
                {item.role === "admin" ? "Administrateur" : "Exploitant"} ·{" "}
                {item.active ? "Accès actif" : "Accès désactivé"}
              </small>
            </div>
          </article>
        ))}
      </div>
    </SettingsPanel>
  );
}
