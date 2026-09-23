import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CartButton } from "../cart/CartButton";
import { AppLink } from "./AppLink";
import { Logo } from "./Logo";
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="announcement">
        Créations artisanales des Pyrénées · Retrait local sur rendez-vous
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Logo compact />
          <nav
            id="main-navigation"
            className={open ? "nav nav--open" : "nav"}
            aria-label="Navigation principale"
          >
            <AppLink
              href="/catalogue?categorie=bougie"
              onNavigate={() => setOpen(false)}
            >
              Bougies
            </AppLink>
            <AppLink
              href="/catalogue?categorie=savon"
              onNavigate={() => setOpen(false)}
            >
              Savons
            </AppLink>
            <AppLink
              href="/catalogue?categorie=coffret"
              onNavigate={() => setOpen(false)}
            >
              Coffrets
            </AppLink>
            <AppLink
              href="/catalogue?categorie=fondant"
              onNavigate={() => setOpen(false)}
            >
              Fondants
            </AppLink>
            <AppLink
              href="/catalogue?categorie=diffuseur"
              onNavigate={() => setOpen(false)}
            >
              Diffuseurs
            </AppLink>
            <AppLink href="/galerie" onNavigate={() => setOpen(false)}>
              Galerie
            </AppLink>
            <AppLink href="/marches" onNavigate={() => setOpen(false)}>
              Marchés
            </AppLink>
            {/*<a href="/#histoire" onClick={() => setOpen(false)}>Notre histoire</a>*/}
          </nav>
          <CartButton />
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
