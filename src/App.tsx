import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, AtSign, CalendarDays, Check, ChevronDown, Flame, Heart, Image as ImageIcon, LayoutDashboard, Leaf, LoaderCircle, LogOut, Menu, PackagePlus, Pencil, Plus, Recycle, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { categoryLabels, demoProducts, formatPrice, type Category, type GalleryImage, type Market, type Product, type ProductVariant } from './data'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { AdminGallery, AdminMarkets, AdminOverview, type AdminView } from './AdminExtras'

const emptyProduct: Omit<Product, 'id'> = { name: '', slug: '', category: 'bougie', short_description: '', description: '', price: 0, price_visible: true, color: '', scent: '', composition: '', weight: '', image_url: '', featured: false, published: true, sort_order: 0 }

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  return path
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <a href="/" onClick={(event) => { event.preventDefault(); navigate('/') }} className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Douceur d'ici, accueil"><img src="/assets/logo-douceur-dici.png" alt="" /><span><strong>Douceur d’ici</strong><small>Artisan des Pyrénées</small></span></a>
}

function Header() {
  const [open, setOpen] = useState(false)
  const go = (path: string) => { setOpen(false); navigate(path) }
  return <><div className="announcement">Créations artisanales des Pyrénées · Retrait local sur rendez-vous</div><header className="site-header"><div className="header-inner">
    <Logo compact />
    <nav className={open ? 'nav nav--open' : 'nav'} aria-label="Navigation principale">
      <button onClick={() => go('/catalogue?categorie=bougie')}>Bougies</button><button onClick={() => go('/catalogue?categorie=savon')}>Savons</button><button onClick={() => go('/galerie')}>Galerie</button><button onClick={() => go('/marches')}>Marchés</button><a href="/#histoire" onClick={() => setOpen(false)}>Notre histoire</a>
    </nav>
    <button className="shop-button" onClick={() => go('/catalogue')}><ShoppingBag size={17} /> La boutique</button><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>{open ? <X /> : <Menu />}</button>
  </div></header></>
}

function Footer() {
  return <footer id="contact" className="footer"><div className="footer-grid"><Logo /><div><h3>Boutique</h3><button onClick={() => navigate('/catalogue?categorie=bougie')}>Bougies</button><button onClick={() => navigate('/catalogue?categorie=savon')}>Savons</button><button onClick={() => navigate('/catalogue?categorie=coffret')}>Coffrets</button></div><div><h3>La maison</h3><a href="/#histoire">Notre histoire</a><a href="/#recharge">Notre engagement</a><a href="mailto:bonjour@douceurdici.com">Nous écrire</a></div><div><h3>Nous retrouver</h3><a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><AtSign size={17} /> Instagram</a><a href="mailto:bonjour@douceurdici.com">bonjour@douceurdici.com</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Douceur d’ici</span><span>Fabriqué avec soin dans les Pyrénées</span><div className="footer-legal-links"><button onClick={() => navigate('/mentions-legales')}>Mentions légales</button><button onClick={() => navigate('/admin')}>Administration</button></div></div></footer>
}

function ProductCard({ product }: { product: Product }) {
  const variants = product.product_variants ?? []
  const colors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))]
  const scents = [...new Set(variants.map((variant) => variant.scent).filter(Boolean))]
  const details = [scents.length && `Parfums : ${scents.join(', ')}`, colors.length && `Couleurs : ${colors.join(', ')}`, product.weight].filter(Boolean).join(' · ')
  return <article className="product-card"><div className="product-image-wrap"><img src={product.image_url || '/assets/creations-douceur-dici.jpg'} alt={product.name} /><span>{categoryLabels[product.category]}</span><button aria-label={`Ajouter ${product.name} aux favoris`}><Heart size={18} /></button></div><div className="product-info"><div><h3>{product.name}</h3><p>{details || product.short_description}</p>{variants.length === 1 && variants[0].composition && <small>{variants[0].composition}</small>}</div>{product.price_visible !== false && <strong>{formatPrice(Number(product.price))}</strong>}</div></article>
}

function variantSummary(product: Product) {
  const variants = product.product_variants ?? []
  if (variants.length) return variants.map((variant) => `${variant.scent} · ${variant.color}`).join(' | ')
  return [product.scent, product.color].filter(Boolean).join(' · ') || '—'
}

function usePublicProducts() {
  const [products, setProducts] = useState<Product[]>(demoProducts)
  useEffect(() => {
    if (!supabase) return
    supabase.from('products').select('*, product_variants(*)').eq('published', true).order('sort_order').then(({ data, error }) => { if (!error && data?.length) setProducts(data as Product[]) })
  }, [])
  return products
}

function Home() {
  const products = usePublicProducts()
  const featured = [...products.filter((product) => product.featured), ...products.filter((product) => !product.featured)]
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .slice(0, 4)

  return <><Header /><main>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Bougies & savons artisanaux</span>
        <h1>Bougies & savons <em>artisanaux</em></h1>
        <p className="script">pour des rituels simples<br />et sensoriels</p>
        <p className="hero-text">Des créations faites à la main avec des ingrédients choisis, dans le respect de la nature et de vos instants du quotidien.</p>
        <div className="button-row"><button className="button button--dark" onClick={() => navigate('/catalogue')}>Découvrir la collection</button><a className="button button--light" href="#histoire">Notre histoire</a></div>
      </div>
      <div className="hero-image"><img src="/assets/DSC0270655.JPG" alt="Bougies sculptées Douceur d’ici dans un décor naturel" /></div>
      <img className="botanical botanical--hero" src="/assets/branche-botanique.png" alt="" />
    </section>

    <section className="values" aria-label="Nos engagements">
      <article><Leaf /><div><h2>Fabrication artisanale</h2><p>Fait main en petits lots dans notre atelier.</p></div></article>
      <article><Sparkles /><div><h2>Ingrédients choisis</h2><p>Des matières sélectionnées avec attention.</p></div></article>
      <article><Recycle /><div><h2>Pots rechargeables</h2><p>Pensés pour être réutilisés, encore et encore.</p></div></article>
    </section>

    <section className="category-grid section-shell">
      <article className="category-card category-card--candles"><img src="/assets/DSC026881.JPG" alt="Bougies artisanales fleuries Douceur d’ici" /><div><h2>Bougies<br />artisanales</h2><p>Cires végétales & créations délicates.</p><button onClick={() => navigate('/catalogue?categorie=bougie')}>Découvrir <ArrowRight /></button></div></article>
      <article className="category-card category-card--soap"><img src="/assets/savon-lavande.png" alt="Savon artisanal à la lavande" /><div><h2>Savons<br />artisanaux</h2><p>Doux, généreux et fabriqués avec soin.</p><button onClick={() => navigate('/catalogue?categorie=savon')}>Découvrir <ArrowRight /></button></div></article>
    </section>

    <section id="recharge" className="recharge section-shell">
      <div className="recharge-copy"><h2>Donnez une seconde vie <em>à vos bougies</em></h2><p>Nos pots sont faits pour durer. Rapportez-les à l’atelier et faites-les remplir avec le parfum de votre choix.</p><a className="button button--dark" href="mailto:bonjour@douceurdici.com?subject=Recharge%20de%20ma%20bougie">En savoir plus</a></div>
      <div className="steps"><div><span>1.</span><Flame /><strong>Utilisez</strong><small>Profitez pleinement<br />de votre bougie.</small></div><ArrowRight /><div><span>2.</span><ShoppingBag /><strong>Rapportez</strong><small>Ramenez votre pot<br />à l’atelier.</small></div><ArrowRight /><div><span>3.</span><Recycle /><strong>Remplissez</strong><small>Nous le nettoyons<br />et le remplissons.</small></div></div>
    </section>

    <section className="featured section-shell"><div className="section-heading"><h2>Nos créations phares</h2><button onClick={() => navigate('/catalogue')}>Voir tout le catalogue <ArrowRight /></button></div><div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

    <section id="histoire" className="story section-shell">
      <div className="story-image"><img src="/assets/DSC02699.JPG" alt="Bougie ourson façonnée à la main par Douceur d’ici" /></div>
      <div className="story-copy"><span className="eyebrow">Notre histoire</span><h2>Un atelier, <em>une passion</em></h2><p>Douceur d’ici est née au cœur des Pyrénées, de l’envie de créer des objets beaux, simples et responsables. Chaque pièce est imaginée et préparée à la main.</p><a href="mailto:bonjour@douceurdici.com">Découvrir notre histoire <ArrowRight /></a></div>
      <blockquote><span>“</span>La durabilité n’est pas une contrainte, c’est une promesse de douceur qui dure dans le temps.<small>♡</small></blockquote>
    </section>

    <section className="social-band">
      <div className="instagram"><div className="instagram-title"><h2>Sur Instagram <em>un peu d’inspiration</em></h2><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Voir le compte <ArrowRight /></a></div><div className="instagram-grid"><img src="/assets/DSC026835.JPG" alt="Bougie ourson jaune Douceur d’ici" /><img src="/assets/DSC026881.JPG" alt="Bougies fleuries dans leur panier" /><img src="/assets/DSC027065.JPG" alt="Bougies sculptées aux tons naturels" /><img src="/assets/DSC0270655.JPG" alt="Collection de bougies dans un décor naturel" /></div></div>
    </section>
  </main><Footer /></>
}

function Catalogue() {
  const products = usePublicProducts()
  const initial = new URLSearchParams(window.location.search).get('categorie') as Category | null
  const [filter, setFilter] = useState<Category | 'tous'>(initial && categoryLabels[initial] ? initial : 'tous')
  const filtered = filter === 'tous' ? products : products.filter((product) => product.category === filter)
  return <><Header /><main className="catalogue-page"><section className="catalogue-hero"><span className="eyebrow">La boutique</span><h1>Nos créations artisanales</h1><p>Des bougies, savons et coffrets préparés en petites séries dans les Pyrénées.</p></section><section className="catalogue-content section-shell"><div className="filters" role="group" aria-label="Filtrer le catalogue"><button className={filter === 'tous' ? 'active' : ''} onClick={() => setFilter('tous')}>Tout</button>{(Object.keys(categoryLabels) as Category[]).map((key) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{categoryLabels[key]}</button>)}</div>{filtered.length ? <div className="product-grid product-grid--catalogue">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><Leaf /><h2>Cette collection arrive bientôt.</h2><p>De nouvelles créations sont en préparation à l’atelier.</p></div>}</section></main><Footer /></>
}

function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('gallery_images').select('*').eq('published', true).order('sort_order').then(({ data }) => { setImages((data ?? []) as GalleryImage[]); setLoading(false) })
  }, [])
  return <><Header /><main className="content-page"><header className="content-hero"><span className="eyebrow">L’univers Douceur d’ici</span><h1>Galerie</h1><p>Créations, matières et instants de l’atelier au fil des saisons.</p></header><section className="public-gallery section-shell">{loading ? <div className="page-loading"><LoaderCircle className="spin" /> Chargement des photos…</div> : images.length ? images.map((item) => <figure key={item.id}><img src={item.image_url} alt={item.alt_text || item.caption || 'Création Douceur d’ici'} loading="lazy" /><figcaption>{item.caption}</figcaption></figure>) : <div className="empty-state"><ImageIcon /><h2>La galerie se prépare.</h2><p>Les premières photos seront bientôt ajoutées.</p></div>}</section></main><Footer /></>
}

function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('markets').select('*').eq('published', true).gte('start_date', new Date().toISOString()).order('start_date').then(({ data }) => { setMarkets((data ?? []) as Market[]); setLoading(false) })
  }, [])
  const dateLabel = (date: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
  return <><Header /><main className="content-page"><header className="content-hero"><span className="eyebrow">Retrouvez-nous</span><h1>Calendrier des marchés</h1><p>Les prochaines dates où découvrir nos créations et nous rencontrer.</p></header><section className="market-list section-shell">{loading ? <div className="page-loading"><LoaderCircle className="spin" /> Chargement du calendrier…</div> : markets.length ? markets.map((market) => <article key={market.id}><CalendarDays /><div><time dateTime={market.start_date}>{dateLabel(market.start_date)}</time><h2>{market.name}</h2><strong>{market.location}</strong>{market.details && <p>{market.details}</p>}</div></article>) : <div className="empty-state"><CalendarDays /><h2>Les prochaines dates arrivent.</h2><p>Le calendrier des marchés sera mis à jour prochainement.</p></div>}</section></main><Footer /></>
}

function LegalNoticePage() {
  return <><Header /><main className="legal-page">
    <header className="legal-heading"><span className="eyebrow">Informations légales</span><h1>Mentions légales</h1><p>Informations relatives à l’édition et au fonctionnement du site douceurdici.com.</p></header>
    <div className="legal-layout">
      <aside><p>Dernière mise à jour</p><strong>14 septembre 2026</strong><a href="mailto:bonjour@douceurdici.com">Nous contacter</a></aside>
      <div className="legal-content">
        <section><h2>1. Éditeur du site</h2><p>Le site <strong>douceurdici.com</strong> est édité par Douceur d’ici, artisan de bougies et savons dans les Pyrénées.</p><div className="legal-todo"><strong>À compléter avant la mise en production</strong><p>Nom et prénom ou raison sociale, forme juridique, adresse de domiciliation, numéro SIREN ou SIRET, immatriculation au RNE/RCS, capital social et numéro de TVA intracommunautaire lorsqu’ils sont applicables.</p></div><p>Adresse électronique : <a href="mailto:bonjour@douceurdici.com">bonjour@douceurdici.com</a></p></section>
        <section><h2>2. Direction de la publication</h2><p>La direction de la publication est assurée par la personne responsable de Douceur d’ici.</p><div className="legal-todo"><strong>À compléter avant la mise en production</strong><p>Nom et prénom de la directrice ou du directeur de la publication.</p></div></section>
        <section><h2>3. Hébergement</h2><p>Le site est hébergé par <strong>Hostinger International Limited</strong>, société privée à responsabilité limitée de droit chypriote, 61 Lordou Vironos Street, 6023 Larnaca, Chypre.</p><p><a href="https://www.hostinger.fr/" target="_blank" rel="noreferrer">www.hostinger.fr</a></p></section>
        <section><h2>4. Propriété intellectuelle</h2><p>Les textes, photographies, illustrations, éléments graphiques, logos et créations présentés sur ce site sont protégés par le droit de la propriété intellectuelle. Sauf autorisation écrite préalable, toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, est interdite.</p></section>
        <section><h2>5. Responsabilité</h2><p>Douceur d’ici veille à fournir des informations aussi exactes et à jour que possible. Ces informations sont données à titre indicatif et peuvent évoluer. Douceur d’ici ne peut garantir l’absence d’erreur ou l’accès continu au site.</p></section>
        <section><h2>6. Données personnelles</h2><p>Les messages envoyés à l’adresse de contact sont utilisés uniquement pour répondre à la demande reçue. Des données techniques peuvent être traitées par l’hébergeur pour assurer la sécurité et le bon fonctionnement du site.</p><p>Pour toute question ou pour exercer vos droits d’accès, de rectification, d’effacement, de limitation ou d’opposition, écrivez à <a href="mailto:bonjour@douceurdici.com">bonjour@douceurdici.com</a>.</p></section>
        <section><h2>7. Cookies et stockage local</h2><p>Le site public ne dépose pas de cookies publicitaires ou de mesure d’audience. L’espace d’administration utilise uniquement les mécanismes techniques nécessaires à l’authentification et à la sécurité de la session.</p></section>
        <section><h2>8. Liens externes</h2><p>Le site peut contenir des liens vers des services tiers. Douceur d’ici n’exerce aucun contrôle sur leur contenu ni sur leurs pratiques de confidentialité.</p></section>
      </div>
    </div>
  </main><Footer /></>
}

function Admin() {
  const [sessionUser, setSessionUser] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(isSupabaseConfigured)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    const check = async () => {
      const { data: { session } } = await client.auth.getSession()
      const user = session?.user
      setSessionUser(user?.email ?? null)
      if (user) {
        const { data } = await client.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
        setIsAdmin(Boolean(data))
      } else setIsAdmin(false)
      setChecking(false)
    }
    check()
    const { data } = client.auth.onAuthStateChange(() => check())
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return <AdminSetup />
  if (checking) return <div className="admin-loading"><LoaderCircle className="spin" /><span>Ouverture de l’atelier…</span></div>
  if (!sessionUser) return <AdminLogin onMessage={setMessage} message={message} />
  if (!isAdmin) return <div className="admin-denied"><Logo /><h1>Accès réservé</h1><p>Ce compte existe, mais il n’a pas encore été autorisé à administrer le catalogue.</p><button className="button button--dark" onClick={() => supabase?.auth.signOut()}>Changer de compte</button></div>
  return <AdminDashboard email={sessionUser} />
}

function AdminSetup() {
  return <div className="admin-login"><div className="login-visual"><Logo /><h1>L’atelier numérique</h1><p>Gérez vos créations aussi simplement que vous les présentez en boutique.</p></div><div className="login-panel"><span className="eyebrow">Configuration requise</span><h2>Reliez Supabase pour ouvrir l’administration.</h2><p>Le site public fonctionne déjà avec son catalogue de démonstration. Ajoutez les deux variables Supabase indiquées dans le fichier d’exemple, puis appliquez la migration fournie.</p><button className="button button--light" onClick={() => navigate('/')}>Retour au site</button></div></div>
}

function AdminLogin({ onMessage, message }: { onMessage: (message: string) => void, message: string }) {
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); onMessage('')
    const form = new FormData(event.currentTarget)
    const { error } = await supabase!.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
    if (error) onMessage('Adresse e-mail ou mot de passe incorrect.')
    setLoading(false)
  }
  return <div className="admin-login"><div className="login-visual"><Logo /><h1>L’atelier numérique</h1><p>Votre catalogue, vos nouveautés et vos coups de cœur au même endroit.</p></div><div className="login-panel"><button className="back-link" onClick={() => navigate('/')}><ArrowRight /> Retour au site</button><span className="eyebrow">Espace administrateur</span><h2>Bienvenue à l’atelier.</h2><p>Connectez-vous pour gérer le catalogue Douceur d’ici.</p><form onSubmit={submit}><label>Adresse e-mail<input type="email" name="email" required autoComplete="email" /></label><label>Mot de passe<input type="password" name="password" required autoComplete="current-password" /></label>{message && <div className="form-error">{message}</div>}<button className="button button--dark" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : 'Se connecter'}</button></form></div></div>
}

function AdminDashboard({ email }: { email: string }) {
  const [view, setView] = useState<AdminView>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null | 'new'>(null)
  const [notice, setNotice] = useState('')
  const loadProducts = async () => {
    const { data } = await supabase!.from('products').select('*, product_variants(*)').order('sort_order')
    setProducts((data ?? []) as Product[]); setLoading(false)
  }
  useEffect(() => { loadProducts() }, [])
  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    const report = (error: unknown) => console.warn('WebMCP tool registration failed', error)
    void Promise.resolve(context.registerTool({
      name: 'list_catalog_products',
      title: 'Lister les créations',
      description: 'Liste les créations visibles dans l’administration du catalogue Douceur d’ici.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute() {
        const { data, error } = await supabase!.from('products').select('id,name,category,price,price_visible,published,featured,product_variants(color,scent,composition)').order('sort_order')
        if (error) throw new Error('Le catalogue est indisponible.')
        return { products: data }
      },
    }, { signal: lifecycle.signal })).catch(report)
    void Promise.resolve(context.registerTool({
      name: 'add_catalog_product',
      title: 'Ajouter une création',
      description: 'Ajoute une création au catalogue avec les mêmes autorisations que le formulaire administrateur.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          category: { type: 'string', enum: ['bougie', 'savon', 'diffuseur', 'coffret'] },
          short_description: { type: 'string' }, description: { type: 'string' },
          price: { type: 'number', minimum: 0 }, weight: { type: 'string' },
          price_visible: { type: 'boolean' }, image_url: { type: 'string' }, published: { type: 'boolean' }, featured: { type: 'boolean' },
          variants: { type: 'array', minItems: 1, items: { type: 'object', properties: { color: { type: 'string', minLength: 1 }, scent: { type: 'string', minLength: 1 }, composition: { type: 'string', minLength: 1 } }, required: ['color', 'scent', 'composition'], additionalProperties: false } },
        },
        required: ['name', 'category', 'short_description', 'description', 'price', 'variants'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input) {
        if (!input || typeof input !== 'object') throw new Error('Les informations de la création sont invalides.')
        const value = input as Record<string, unknown>
        const variants = Array.isArray(value.variants) ? value.variants as Record<string, unknown>[] : []
        const variantsAreValid = variants.length > 0 && variants.every((variant) => typeof variant.color === 'string' && variant.color.trim() && typeof variant.scent === 'string' && variant.scent.trim() && typeof variant.composition === 'string' && variant.composition.trim())
        if (typeof value.name !== 'string' || value.name.trim().length < 2 || !['bougie', 'savon', 'diffuseur', 'coffret'].includes(String(value.category)) || typeof value.price !== 'number' || value.price < 0 || typeof value.short_description !== 'string' || typeof value.description !== 'string' || !variantsAreValid) throw new Error('Les champs obligatoires sont invalides.')
        const slug = value.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const firstVariant = variants[0]
        const { data, error } = await supabase!.from('products').insert({ name: value.name.trim(), slug, category: value.category, short_description: value.short_description, description: value.description, price: value.price, price_visible: value.price_visible !== false, color: String(firstVariant.color).trim(), scent: String(firstVariant.scent).trim(), composition: String(firstVariant.composition).trim(), weight: typeof value.weight === 'string' ? value.weight : null, image_url: typeof value.image_url === 'string' ? value.image_url : '', published: value.published !== false, featured: value.featured === true }).select('id,name,slug').single()
        if (error) throw new Error('La création n’a pas pu être ajoutée.')
        const { error: variantsError } = await supabase!.from('product_variants').insert(variants.map((variant, index) => ({ product_id: data.id, color: String(variant.color).trim(), scent: String(variant.scent).trim(), composition: String(variant.composition).trim(), sort_order: index })))
        if (variantsError) {
          await supabase!.from('products').delete().eq('id', data.id)
          throw new Error('Les variantes de la création n’ont pas pu être ajoutées.')
        }
        await loadProducts()
        setNotice('Catalogue mis à jour.')
        return { product: data, status: 'created' }
      },
    }, { signal: lifecycle.signal })).catch(report)
    return () => lifecycle.abort()
  }, [])
  const remove = async (product: Product) => {
    if (!window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) return
    const { error } = await supabase!.from('products').delete().eq('id', product.id)
    if (error) setNotice('La création n’a pas pu être supprimée.'); else { setNotice('Création supprimée.'); loadProducts() }
  }
  const labels: Record<AdminView, { title: string; description: string }> = {
    overview: { title: 'Tableau de bord', description: 'Gérez le contenu visible sur votre site.' },
    products: { title: 'Produits', description: `${products.length} création${products.length > 1 ? 's' : ''} enregistrée${products.length > 1 ? 's' : ''}` },
    gallery: { title: 'Galerie photos', description: 'Ajoutez et organisez les images présentées sur le site.' },
    markets: { title: 'Calendrier des marchés', description: 'Planifiez les prochaines dates où vous rencontrer.' },
  }
  const navItems: { id: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'products', label: 'Produits', icon: ShoppingBag },
    { id: 'gallery', label: 'Galerie photos', icon: ImageIcon },
    { id: 'markets', label: 'Calendrier des marchés', icon: CalendarDays },
  ]
  return <div className="admin-shell"><aside className="admin-sidebar"><Logo compact /><nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon /> {label}</button>)}<button onClick={() => navigate('/')}><ArrowRight /> Voir le site</button></nav><div className="admin-account"><small>Connecté avec</small><span>{email}</span><button onClick={() => supabase!.auth.signOut()}><LogOut /> Se déconnecter</button></div></aside><main className="admin-main"><header><div><span className="eyebrow">Administration</span><h1>{labels[view].title}</h1><p>{labels[view].description}</p></div>{view === 'products' && <button className="button button--dark" onClick={() => setEditing('new')}><PackagePlus /> Ajouter un produit</button>}</header>{notice && view === 'products' && <div className="admin-notice"><Check />{notice}<button onClick={() => setNotice('')}><X /></button></div>}<div className="admin-view">{view === 'overview' && <AdminOverview productCount={products.length} onOpen={setView} />}{view === 'products' && (loading ? <div className="admin-loading-inline"><LoaderCircle className="spin" /> Chargement du catalogue…</div> : <div className="admin-table-wrap"><table><thead><tr><th>Produit</th><th>Parfum & couleur</th><th>Prix</th><th>Visibilité</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.image_url || '/assets/creations-douceur-dici.jpg'} alt="" /><div><strong>{product.name}</strong><small>{categoryLabels[product.category]} · {product.composition || product.short_description}</small></div></div></td><td>{variantSummary(product)}</td><td>{product.price_visible ? formatPrice(Number(product.price)) : <span className="status">Prix masqué</span>}</td><td><span className={product.published ? 'status status--published' : 'status'}>{product.published ? 'En ligne' : 'Brouillon'}</span></td><td><div className="row-actions"><button onClick={() => setEditing(product)} aria-label={`Modifier ${product.name}`}><Pencil /></button><button onClick={() => remove(product)} aria-label={`Supprimer ${product.name}`}><Trash2 /></button></div></td></tr>)}</tbody></table>{!products.length && <div className="empty-state"><PackagePlus /><h2>Votre catalogue est prêt.</h2><p>Ajoutez votre premier produit.</p></div>}</div>)}{view === 'gallery' && <AdminGallery />}{view === 'markets' && <AdminMarkets />}</div></main><AnimatePresence>{editing && <ProductEditor product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Catalogue mis à jour.'); loadProducts() }} />}</AnimatePresence></div>
}

function ProductEditor({ product, onClose, onSaved }: { product: Product | null, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(product ? { ...emptyProduct, ...product } : emptyProduct)
  const [variants, setVariants] = useState<ProductVariant[]>(product?.product_variants?.length ? product.product_variants : [{ color: product?.color ?? '', scent: product?.scent ?? '', composition: product?.composition ?? '', sort_order: 0 }])
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    if (variants.some((variant) => !variant.color.trim() || !variant.scent.trim() || !variant.composition.trim())) {
      setError('Chaque variante doit avoir une couleur, un parfum et une composition.'); setSaving(false); return
    }
    const combinations = variants.map((variant) => `${variant.color.trim().toLowerCase()}|${variant.scent.trim().toLowerCase()}`)
    if (new Set(combinations).size !== combinations.length) {
      setError('Deux variantes utilisent la même couleur et le même parfum.'); setSaving(false); return
    }
    let imageUrl = form.image_url
    if (file) {
      const { data: { user } } = await supabase!.auth.getUser()
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
      const path = `${user!.id}/${crypto.randomUUID()}-${safeName}`
      const upload = await supabase!.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false })
      if (upload.error) { setError('L’image n’a pas pu être envoyée.'); setSaving(false); return }
      imageUrl = supabase!.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const { product_variants: _ignored, ...productFields } = form
    const firstVariant = variants[0]
    const payload = { ...productFields, slug: form.slug || slugify(form.name), image_url: imageUrl, price: Number(form.price), weight: form.weight || null, color: firstVariant.color, scent: firstVariant.scent, composition: firstVariant.composition }
    const query = product ? supabase!.from('products').update(payload).eq('id', product.id).select('id').single() : supabase!.from('products').insert(payload).select('id').single()
    const { data: savedProduct, error: saveError } = await query
    if (saveError || !savedProduct) { setError(saveError?.code === '23505' ? 'Un produit utilise déjà ce nom.' : 'Le produit n’a pas pu être enregistré.'); setSaving(false); return }
    if (product) {
      const { error: deleteError } = await supabase!.from('product_variants').delete().eq('product_id', product.id)
      if (deleteError) { setError('Les anciennes variantes n’ont pas pu être remplacées.'); setSaving(false); return }
    }
    const { error: variantsError } = await supabase!.from('product_variants').insert(variants.map((variant, index) => ({ product_id: savedProduct.id, color: variant.color.trim(), scent: variant.scent.trim(), composition: variant.composition.trim(), sort_order: index })))
    if (variantsError) setError('Le produit est enregistré, mais ses variantes n’ont pas pu être ajoutées.')
    else onSaved()
    setSaving(false)
  }
  return <motion.div className="editor-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <motion.section className="editor-panel" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} aria-modal="true" role="dialog" aria-labelledby="editor-title">
      <header><div><span className="eyebrow">Catalogue</span><h2 id="editor-title">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2></div><button onClick={onClose} aria-label="Fermer"><X /></button></header>
      <form onSubmit={submit}>
        <label>Nom du produit<input value={form.name} onChange={(event) => { update('name', event.target.value); if (!product) update('slug', slugify(event.target.value)) }} required /></label>
        <div className="form-grid"><label>Collection<select value={form.category} onChange={(event) => update('category', event.target.value as Category)}>{(Object.keys(categoryLabels) as Category[]).map((key) => <option key={key} value={key}>{categoryLabels[key]}</option>)}</select><ChevronDown /></label><label>Prix en €<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', Number(event.target.value))} required /></label></div>
        <fieldset className="variant-editor"><legend>Couleurs, parfums et compositions</legend><p>Ajoutez une ligne pour chaque combinaison proposée.</p>{variants.map((variant, index) => <div className="variant-row" key={variant.id ?? index}><label>Couleur<input value={variant.color} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} placeholder="Ivoire" required /></label><label>Parfum<input value={variant.scent} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, scent: event.target.value } : item))} placeholder="Fleur de coton" required /></label><label>Composition<textarea value={variant.composition} onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, composition: event.target.value } : item))} rows={2} placeholder="Cire végétale, mèche coton…" required /></label><button type="button" disabled={variants.length === 1} onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Supprimer la variante ${index + 1}`}><Trash2 /></button></div>)}<button type="button" className="add-variant" onClick={() => setVariants((current) => [...current, { color: '', scent: '', composition: '', sort_order: current.length }])}><Plus /> Ajouter une variante</button></fieldset>
        <label>Description courte<input value={form.short_description} onChange={(event) => update('short_description', event.target.value)} placeholder="Une phrase visible dans le catalogue" required /></label>
        <label>Description détaillée<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} required /></label>
        <div className="form-grid"><label>Poids / format<input value={form.weight ?? ''} onChange={(event) => update('weight', event.target.value)} placeholder="180 g" /></label><label>Ordre d’affichage<input type="number" value={form.sort_order} onChange={(event) => update('sort_order', Number(event.target.value))} /></label></div>
        <label>Photo<input className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />{form.image_url && <small>Une image est déjà associée à ce produit.</small>}</label>
        <div className="switches"><label><input type="checkbox" checked={form.price_visible} onChange={(event) => update('price_visible', event.target.checked)} /><span />Afficher le prix sur le site</label><label><input type="checkbox" checked={form.published} onChange={(event) => update('published', event.target.checked)} /><span />Visible dans la boutique</label><label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span />Afficher parmi les créations phares</label></div>
        {error && <div className="form-error">{error}</div>}<footer><button type="button" className="button button--light" onClick={onClose}>Annuler</button><button className="button button--dark" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> Enregistrement…</> : 'Enregistrer'}</button></footer>
      </form>
    </motion.section>
  </motion.div>
}

export default function App() {
  const path = usePath()
  const page = useMemo(() => path.startsWith('/admin') ? <Admin /> : path.startsWith('/catalogue') ? <Catalogue /> : path.startsWith('/galerie') ? <GalleryPage /> : path.startsWith('/marches') ? <MarketsPage /> : path.startsWith('/mentions-legales') ? <LegalNoticePage /> : <Home />, [path])
  return page
}
