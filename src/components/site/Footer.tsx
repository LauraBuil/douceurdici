import { AtSign } from "lucide-react";
import { AppLink } from "./AppLink";
import { Logo } from "./Logo";
export function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footer-grid">
        <Logo />

        <div>
          <h3>Boutique</h3>
          <AppLink href="/catalogue?categorie=bougie">Bougies</AppLink>
          <AppLink href="/catalogue?categorie=savon">Savons</AppLink>
          <AppLink href="/catalogue?categorie=coffret">Coffrets</AppLink>
          <AppLink href="/catalogue?categorie=fondant">Fondants</AppLink>
          <AppLink href="/catalogue?categorie=diffuseur">Diffuseurs</AppLink>
        </div>

        <div>
          <h3>La maison</h3>
          <a href="/#recharge">Mes engagements</a>
          <a href="mailto:douceurdici@protonmail.com">M'écrire</a>
        </div>

        <div>
          <h3>Nous retrouver</h3>
          <a href="https://www.instagram.com/douceur_d_ici_65" target="_blank" rel="noreferrer">
            <AtSign size={17} /> Instagram
          </a>
          <a href="mailto:douceurdici@protonmail.com">
            douceurdici@protonmail.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Douceur d’ici, conçu et développé par
          Laura Buil
        </span>
        <span>Fabriqué avec soin dans les Pyrénées</span>
        <div className="footer-legal-links">
          <AppLink href="/mentions-legales">Mentions légales</AppLink>
          <AppLink href="/cgv">CGV</AppLink>
          <AppLink href="/confidentialite">Confidentialité</AppLink>
          <AppLink href="/retours">Retours</AppLink>
          <AppLink href="/admin">Administration</AppLink>
        </div>
      </div>
    </footer>
  );
}
