import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import type { StaffRole } from "../../data";
import { navigate } from "../../lib/navigation";
import { Logo } from "../site/Logo";
import { AdminDashboard } from "./AdminDashboard";
export function Admin() {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const check = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();
      const user = session?.user;
      setSessionUser(user?.email ?? null);
      if (user) {
        const { data } = await client
          .from("admins")
          .select("role,active")
          .eq("user_id", user.id)
          .maybeSingle();
        setRole(data?.active ? (data.role as StaffRole) : null);
      } else setRole(null);
      setChecking(false);
    };
    check();
    const { data } = client.auth.onAuthStateChange(() => check());
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <AdminSetup />;
  if (checking)
    return (
      <div className="admin-loading">
        <LoaderCircle className="spin" />
        <span>Ouverture de l’atelier…</span>
      </div>
    );
  if (!sessionUser)
    return <AdminLogin onMessage={setMessage} message={message} />;
  if (!role)
    return (
      <div className="admin-denied">
        <Logo />
        <h1>Accès réservé</h1>
        <p>
          Ce compte existe, mais il n’a pas encore été autorisé à administrer le
          catalogue.
        </p>
        <button
          className="button button--dark"
          onClick={() => supabase?.auth.signOut()}
        >
          Changer de compte
        </button>
      </div>
    );
  return <AdminDashboard email={sessionUser} role={role} />;
}

function AdminSetup() {
  return (
    <div className="admin-login">
      <div className="login-visual">
        <Logo />
        <h1>L’atelier numérique</h1>
        <p>
          Gérez vos créations aussi simplement que vous les présentez en
          boutique.
        </p>
      </div>
      <div className="login-panel">
        <span className="eyebrow">Configuration requise</span>
        <h2>Reliez Supabase pour ouvrir l’administration.</h2>
        <p>
          Le site public fonctionne déjà avec son catalogue de démonstration.
          Ajoutez les deux variables Supabase indiquées dans le fichier
          d’exemple, puis appliquez la migration fournie.
        </p>
        <button className="button button--light" onClick={() => navigate("/")}>
          Retour au site
        </button>
      </div>
    </div>
  );
}

function AdminLogin({
  onMessage,
  message,
}: {
  onMessage: (message: string) => void;
  message: string;
}) {
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    onMessage("");
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) onMessage("Adresse e-mail ou mot de passe incorrect.");
    setLoading(false);
  };
  return (
    <div className="admin-login">
      <div className="login-visual">
        <Logo />
        <h1>L’atelier numérique</h1>
        <p>
          Votre catalogue, vos nouveautés et vos coups de cœur au même endroit.
        </p>
      </div>
      <div className="login-panel">
        <button className="back-link" onClick={() => navigate("/")}>
          <ArrowRight /> Retour au site
        </button>
        <span className="eyebrow">Espace administrateur</span>
        <h2>Bienvenue à l’atelier.</h2>
        <p>Connectez-vous pour gérer le catalogue Douceur d’ici.</p>
        <form onSubmit={submit}>
          <label>
            Adresse e-mail
            <input type="email" name="email" required autoComplete="email" />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          {message && <div className="form-error">{message}</div>}
          <button className="button button--dark" disabled={loading}>
            {loading ? <LoaderCircle className="spin" /> : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
