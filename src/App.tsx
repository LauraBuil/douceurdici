import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, AtSign, Check, ChevronDown, Flame, Heart, Leaf, LoaderCircle, LogOut, Menu, PackagePlus, Pencil, Recycle, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { categoryLabels, demoProducts, formatPrice, type Category, type Product } from './data'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const emptyProduct: Omit<Product, 'id'> = { name: '', slug: '', category: 'bougie', short_description: '', description: '', price: 0, weight: '', image_url: '', featured: false, published: true, sort_order: 0 }

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
      <button onClick={() => go('/catalogue?categorie=bougie')}>Bougies</button><button onClick={() => go('/catalogue?categorie=savon')}>Savons</button><a href="/#histoire" onClick={() => setOpen(false)}>Notre histoire</a><a href="/#recharge" onClick={() => setOpen(false)}>La recharge</a><a href="/#contact" onClick={() => setOpen(false)}>Contact</a>
    </nav>
    <button className="shop-button" onClick={() => go('/catalogue')}><ShoppingBag size={17} /> La boutique</button><button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>{open ? <X /> : <Menu />}</button>
  </div></header></>
}

function Footer() {
  return <footer id="contact" className="footer"><div className="footer-grid"><Logo /><div><h3>Boutique</h3><button onClick={() => navigate('/catalogue?categorie=bougie')}>Bougies</button><button onClick={() => navigate('/catalogue?categorie=savon')}>Savons</button><button onClick={() => navigate('/catalogue?categorie=coffret')}>Coffrets</button></div><div><h3>La maison</h3><a href="/#histoire">Notre histoire</a><a href="/#recharge">Notre engagement</a><a href="mailto:bonjour@douceurdici.com">Nous écrire</a></div><div><h3>Nous retrouver</h3><a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><AtSign size={17} /> Instagram</a><a href="mailto:bonjour@douceurdici.com">bonjour@douceurdici.com</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Douceur d’ici</span><span>Fabriqué avec soin dans les Pyrénées</span><button onClick={() => navigate('/admin')}>Administration</button></div></footer>
}

function ProductCard({ product }: { product: Product }) {
  return <article className="product-card"><div className="product-image-wrap"><img src={product.image_url || '/assets/creations-douceur-dici.jpg'} alt={product.name} /><span>{categoryLabels[product.category]}</span><button aria-label={`Ajouter ${product.name} aux favoris`}><Heart size={18} /></button></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.short_description}{product.weight ? ` · ${product.weight}` : ''}</p></div><strong>{formatPrice(Number(product.price))}</strong></div></article>
}

function usePublicProducts() {
  const [products, setProducts] = useState<Product[]>(demoProducts)
  useEffect(() => {
    if (!supabase) return
    supabase.from('products').select('*').eq('published', true).order('sort_order').then(({ data, error }) => { if (!error && data?.length) setProducts(data as Product[]) })
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
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null | 'new'>(null)
  const [notice, setNotice] = useState('')
  const loadProducts = async () => {
    const { data } = await supabase!.from('products').select('*').order('sort_order')
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
        const { data, error } = await supabase!.from('products').select('id,name,category,price,published,featured').order('sort_order')
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
          image_url: { type: 'string' }, published: { type: 'boolean' }, featured: { type: 'boolean' },
        },
        required: ['name', 'category', 'short_description', 'description', 'price'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input) {
        if (!input || typeof input !== 'object') throw new Error('Les informations de la création sont invalides.')
        const value = input as Record<string, unknown>
        if (typeof value.name !== 'string' || value.name.trim().length < 2 || !['bougie', 'savon', 'diffuseur', 'coffret'].includes(String(value.category)) || typeof value.price !== 'number' || value.price < 0 || typeof value.short_description !== 'string' || typeof value.description !== 'string') throw new Error('Les champs obligatoires sont invalides.')
        const slug = value.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const { data, error } = await supabase!.from('products').insert({ name: value.name.trim(), slug, category: value.category, short_description: value.short_description, description: value.description, price: value.price, weight: typeof value.weight === 'string' ? value.weight : null, image_url: typeof value.image_url === 'string' ? value.image_url : '', published: value.published !== false, featured: value.featured === true }).select('id,name,slug').single()
        if (error) throw new Error('La création n’a pas pu être ajoutée.')
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
  return <div className="admin-shell"><aside className="admin-sidebar"><Logo compact /><nav><button className="active"><ShoppingBag /> Catalogue</button><button onClick={() => navigate('/')}><ArrowRight /> Voir le site</button></nav><div className="admin-account"><small>Connecté avec</small><span>{email}</span><button onClick={() => supabase!.auth.signOut()}><LogOut /> Se déconnecter</button></div></aside><main className="admin-main"><header><div><span className="eyebrow">Administration</span><h1>Le catalogue</h1><p>{products.length} création{products.length > 1 ? 's' : ''} enregistrée{products.length > 1 ? 's' : ''}</p></div><button className="button button--dark" onClick={() => setEditing('new')}><PackagePlus /> Ajouter une création</button></header>{notice && <div className="admin-notice"><Check />{notice}<button onClick={() => setNotice('')}><X /></button></div>}{loading ? <div className="admin-loading-inline"><LoaderCircle className="spin" /> Chargement du catalogue…</div> : <div className="admin-table-wrap"><table><thead><tr><th>Création</th><th>Collection</th><th>Prix</th><th>Visibilité</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.image_url || '/assets/creations-douceur-dici.jpg'} alt="" /><div><strong>{product.name}</strong><small>{product.short_description}</small></div></div></td><td>{categoryLabels[product.category]}</td><td>{formatPrice(Number(product.price))}</td><td><span className={product.published ? 'status status--published' : 'status'}>{product.published ? 'En ligne' : 'Brouillon'}</span></td><td><div className="row-actions"><button onClick={() => setEditing(product)} aria-label={`Modifier ${product.name}`}><Pencil /></button><button onClick={() => remove(product)} aria-label={`Supprimer ${product.name}`}><Trash2 /></button></div></td></tr>)}</tbody></table>{!products.length && <div className="empty-state"><PackagePlus /><h2>Votre catalogue est prêt.</h2><p>Ajoutez votre première création pour la voir apparaître dans la boutique.</p></div>}</div>}</main><AnimatePresence>{editing && <ProductEditor product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Catalogue mis à jour.'); loadProducts() }} />}</AnimatePresence></div>
}

function ProductEditor({ product, onClose, onSaved }: { product: Product | null, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(product ? { ...product } : emptyProduct)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    let imageUrl = form.image_url
    if (file) {
      const { data: { user } } = await supabase!.auth.getUser()
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
      const path = `${user!.id}/${crypto.randomUUID()}-${safeName}`
      const upload = await supabase!.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false })
      if (upload.error) { setError('L’image n’a pas pu être envoyée.'); setSaving(false); return }
      imageUrl = supabase!.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const payload = { ...form, slug: form.slug || slugify(form.name), image_url: imageUrl, price: Number(form.price), weight: form.weight || null }
    const query = product ? supabase!.from('products').update(payload).eq('id', product.id) : supabase!.from('products').insert(payload)
    const { error: saveError } = await query
    if (saveError) setError(saveError.code === '23505' ? 'Une création utilise déjà ce nom ou cette adresse.' : 'La création n’a pas pu être enregistrée.'); else onSaved()
    setSaving(false)
  }
  return <motion.div className="editor-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><motion.section className="editor-panel" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} aria-modal="true" role="dialog" aria-labelledby="editor-title"><header><div><span className="eyebrow">Catalogue</span><h2 id="editor-title">{product ? 'Modifier la création' : 'Nouvelle création'}</h2></div><button onClick={onClose} aria-label="Fermer"><X /></button></header><form onSubmit={submit}><label>Nom de la création<input value={form.name} onChange={(event) => { update('name', event.target.value); if (!product) update('slug', slugify(event.target.value)) }} required /></label><div className="form-grid"><label>Collection<select value={form.category} onChange={(event) => update('category', event.target.value as Category)}>{(Object.keys(categoryLabels) as Category[]).map((key) => <option key={key} value={key}>{categoryLabels[key]}</option>)}</select><ChevronDown /></label><label>Prix en €<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', Number(event.target.value))} required /></label></div><label>Description courte<input value={form.short_description} onChange={(event) => update('short_description', event.target.value)} placeholder="Cire végétale · Parfum floral" required /></label><label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} required /></label><div className="form-grid"><label>Poids / format<input value={form.weight ?? ''} onChange={(event) => update('weight', event.target.value)} placeholder="180 g" /></label><label>Ordre d’affichage<input type="number" value={form.sort_order} onChange={(event) => update('sort_order', Number(event.target.value))} /></label></div><label>Photo<input className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />{form.image_url && <small>Une image est déjà associée à cette création.</small>}</label><div className="switches"><label><input type="checkbox" checked={form.published} onChange={(event) => update('published', event.target.checked)} /><span />Visible dans la boutique</label><label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span />Afficher parmi les créations phares</label></div>{error && <div className="form-error">{error}</div>}<footer><button type="button" className="button button--light" onClick={onClose}>Annuler</button><button className="button button--dark" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> Enregistrement…</> : 'Enregistrer'}</button></footer></form></motion.section></motion.div>
}

export default function App() {
  const path = usePath()
  const page = useMemo(() => path.startsWith('/admin') ? <Admin /> : path.startsWith('/catalogue') ? <Catalogue /> : <Home />, [path])
  return page
}
