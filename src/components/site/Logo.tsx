import { navigate } from "../../lib/navigation";
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/"
      onClick={(event) => {
        event.preventDefault();
        navigate("/");
      }}
      className={`brand ${compact ? "brand--compact" : ""}`}
      aria-label="Douceur d'ici, accueil"
    >
      <img src="/assets/logo-douceur-dici.png" alt="" />
      <span>
        <strong>Douceur d’ici</strong>
        <small>Artisan des Pyrénées</small>
      </span>
    </a>
  );
}
