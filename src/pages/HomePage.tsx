import {
  ArrowRight,
  Flame,
  Leaf,
  Recycle,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useDocumentTitle } from "../lib/formatters";
import { navigate } from "../lib/navigation";
import { usePublicProducts } from "../lib/catalog";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { ProductCard } from "../components/products/ProductCard";
export function Home() {
  useDocumentTitle("Bougies & créations artisanales des Pyrénées");
  const products = usePublicProducts();
  const featured = [
    ...products.filter((product) => product.featured),
    ...products.filter((product) => !product.featured),
  ]
    .filter(
      (product, index, list) =>
        list.findIndex((item) => item.id === product.id) === index,
    )
    .slice(0, 4);

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Bougies & savons artisanaux</span>
            <h1>
              Bougies & savons <em>artisanaux</em>
            </h1>
            <p className="script">
              pour des rituels simples
              <br />
              et sensoriels
            </p>
            <p className="hero-text">
              Des créations faites à la main avec des ingrédients choisis, dans
              le respect de la nature et de vos instants du quotidien.
            </p>
            <div className="button-row">
              <button
                className="button button--dark"
                onClick={() => navigate("/catalogue")}
              >
                Découvrir la collection
              </button>
              {/*<a className="button button--light" href="#histoire">Notre histoire</a>*/}
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/assets/DSC0270655.JPG"
              alt="Bougies sculptées Douceur d’ici dans un décor naturel"
            />
          </div>
          <img
            className="botanical botanical--hero"
            src="/assets/branche-botanique.png"
            alt=""
          />
        </section>

        <section className="values" aria-label="Mes engagements">
          <article>
            <Leaf />
            <div>
              <h2>Fabrication artisanale</h2>
              <p>Fait main en petits lots dans mon atelier.</p>
            </div>
          </article>
          <article>
            <Sparkles />
            <div>
              <h2>Ingrédients choisis</h2>
              <p>Des matières sélectionnées avec attention.</p>
            </div>
          </article>
          <article>
            <Recycle />
            <div>
              <h2>Pots rechargeables</h2>
              <p>Pensés pour être réutilisés, encore et encore.</p>
            </div>
          </article>
        </section>

        <section className="category-grid section-shell">
          <article className="category-card category-card--candles">
            <img
              src="/assets/DSC026881.JPG"
              alt="Bougies artisanales fleuries Douceur d’ici"
            />
            <div>
              <h2>
                Bougies
                <br />
                artisanales
              </h2>
              <p>Cires végétales & créations délicates.</p>
              <button onClick={() => navigate("/catalogue?categorie=bougie")}>
                Découvrir <ArrowRight />
              </button>
            </div>
          </article>
          <article className="category-card category-card--soap">
            <img
              src="/assets/savon-lavande.png"
              alt="Savon artisanal à la lavande"
            />
            <div>
              <h2>
                Savons
                <br />
                artisanaux
              </h2>
              <p>Doux, généreux et fabriqués avec soin.</p>
              <button onClick={() => navigate("/catalogue?categorie=savon")}>
                Découvrir <ArrowRight />
              </button>
            </div>
          </article>
        </section>

        <section id="recharge" className="recharge section-shell">
          <div className="recharge-copy">
            <h2>
              Donnez une seconde vie <em>à vos bougies</em>
            </h2>
            <p>
              Mes pots sont faits pour durer. Rapportez-les à l’atelier et
              faites-les remplir avec le parfum de votre choix.
            </p>
            <a
              className="button button--dark"
              href="mailto:douceurdici@protonmail.com?subject=Recharge%20de%20ma%20bougie"
            >
              En savoir plus
            </a>
          </div>
          <div className="steps">
            <div>
              <span>1.</span>
              <Flame />
              <strong>Utilisez</strong>
              <small>
                Profitez pleinement
                <br />
                de votre bougie.
              </small>
            </div>
            <ArrowRight />
            <div>
              <span>2.</span>
              <ShoppingBag />
              <strong>Rapportez</strong>
              <small>
                Ramenez votre pot
                <br />à l’atelier.
              </small>
            </div>
            <ArrowRight />
            <div>
              <span>3.</span>
              <Recycle />
              <strong>Remplissez</strong>
              <small>
                Nous le nettoyons
                <br />
                et le remplissons.
              </small>
            </div>
          </div>
        </section>

        <section className="featured section-shell">
          <div className="section-heading">
            <h2>Mes créations phares</h2>
            <button onClick={() => navigate("/catalogue")}>
              Voir tout le catalogue <ArrowRight />
            </button>
          </div>
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section id="histoire" className="story section-shell">
          <div className="story-image">
            <img
              src="/assets/DSC02699.JPG"
              alt="Bougie ourson façonnée à la main par Douceur d’ici"
            />
          </div>
          <div className="story-copy">
            {/*<span className="eyebrow">Notre histoire</span>*/}
            <h2>
              Un atelier, <em>une passion</em>
            </h2>
            <p>
              Douceur d’ici est née au cœur des Pyrénées, de l’envie de créer
              des objets beaux, simples et responsables. Chaque pièce est
              imaginée et préparée à la main.
            </p>
            {/*<a href="mailto:douceurdici@protonmail.com">Découvrir notre histoire <ArrowRight /></a>*/}
          </div>
          <blockquote>
            <span>“</span>La durabilité n’est pas une contrainte, c’est une
            promesse de douceur qui dure dans le temps.<small>♡</small>
          </blockquote>
        </section>

        <section className="social-band">
          <div className="instagram">
            <div className="instagram-title">
              <h2>
                Sur Instagram <em>un peu d’inspiration</em>
              </h2>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
              >
                Voir le compte <ArrowRight />
              </a>
            </div>
            <div className="instagram-grid">
              <img
                src="/assets/DSC026835.JPG"
                alt="Bougie ourson jaune Douceur d’ici"
              />
              <img
                src="/assets/DSC026881.JPG"
                alt="Bougies fleuries dans leur panier"
              />
              <img
                src="/assets/DSC027065.JPG"
                alt="Bougies sculptées aux tons naturels"
              />
              <img
                src="/assets/DSC0270655.JPG"
                alt="Collection de bougies dans un décor naturel"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
