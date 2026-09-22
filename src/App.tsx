import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, AtSign, CalendarDays, Check, ChevronLeft, Flame, Image as ImageIcon, LayoutDashboard, Leaf, LoaderCircle, LogOut, Menu, PackagePlus, Pencil, Recycle, Search, Settings, ShoppingBag, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { demoProducts, formatPrice, productCategoryLabel, productCategoryRecords, productPrimaryImage, type CatalogCategory, type CatalogColor, type CatalogFragrance, type GalleryImage, type Market, type Product, type ProductImage, type StaffRole } from './data'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { AdminGallery, AdminMarkets, AdminOverview, type AdminView } from './AdminExtras'
import { AdminSettings } from './AdminSettings'

const PRODUCT_SELECT = '*, category_record:catalog_categories!products_category_id_fkey(*), product_categories(category_id,category:catalog_categories!product_categories_category_id_fkey(*)), product_colors(color_id,color:catalog_colors(*)), product_fragrances(fragrance_id,fragrance:catalog_fragrances(*)), product_images(*)'
const emptyProduct: Omit<Product, 'id'> = { name: '', slug: '', category: '', category_id: null, short_description: '', description: '', price: 0, price_visible: true, color: '', scent: '', composition: '', weight: '', image_url: '', featured: false, published: true, sort_order: 0 }

const currentPathWithSearch = () => `${window.location.pathname}${window.location.search}`
let catalogueReturnPosition: { path: string; scrollY: number } | null = null

function navigate(path: string, state: Record<string, string> = {}, scroll: 'top' | 'preserve' = 'top') {
  window.history.pushState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  if (scroll === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
}

function usePath() {
  const [path, setPath] = useState(currentPathWithSearch)
  useEffect(() => {
    const update = () => setPath(currentPathWithSearch())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  return path
}

const categoryAliases: Record<string, string> = {
  bougies: 'bougie',
  savons: 'savon',
  coffrets: 'coffret',
  fondants: 'fondant',
  diffuseurs: 'diffuseur',
  parfums: 'diffuseur',
}

const normalizeCategorySlug = (slug: string) => categoryAliases[slug] ?? slug

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Douceur d’ici`
    return () => { document.title = 'Douceur d’ici · Bougies & savons artisanaux des Pyrénées' }
  }, [title])
}

const formatProductFormat = (value: string | null | undefined) => value?.trim().replace(/(\d)\s*(g|kg|ml|cl|l)\b/gi, '$1 $2') ?? ''

function ProductDescription({ description }: { description: string }) {
  const markers = [...description.matchAll(/\*\*(Caract[eé]ristiques\s*:|Conseils d[’']utilisation\s*:)\*\*/gi)]
  if (!markers.length) return <p className="product-description">{description.replace(/\*\*/g, '')}</p>
  const intro = description.slice(0, markers[0].index).trim()
  const sections = markers.map((marker, index) => {
    const start = (marker.index ?? 0) + marker[0].length
    const end = markers[index + 1]?.index ?? description.length
    return { title: marker[1].replace(/\s*:$/, ''), content: description.slice(start, end).trim() }
  })
  return <div className="product-description"><p>{intro.replace(/\*\*/g, '')}</p>{sections.map((section) => {
    const items = section.content.replace(/^[-–]\s*/, '').split(/\s+[-–]\s+/).map((item) => item.trim()).filter(Boolean)
    return <section key={section.title}><h2>{section.title}</h2>{items.length > 1 ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{section.content.replace(/\*\*/g, '')}</p>}</section>
  })}</div>
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <a href="/" onClick={(event) => { event.preventDefault(); navigate('/') }} className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Douceur d'ici, accueil"><img src="/assets/logo-douceur-dici.png" alt="" /><span><strong>Douceur d’ici</strong><small>Artisan des Pyrénées</small></span></a>
}

function AppLink({ href, children, className, onNavigate }: { href: string; children: ReactNode; className?: string; onNavigate?: () => void }) {
  return <a href={href} className={className} onClick={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault(); onNavigate?.(); navigate(href)
  }}>{children}</a>
}

function Header() {
  const [open, setOpen] = useState(false)
  return <><div className="announcement">Créations artisanales des Pyrénées · Retrait local sur rendez-vous</div><header className="site-header"><div className="header-inner">
    <Logo compact />
    <nav id="main-navigation" className={open ? 'nav nav--open' : 'nav'} aria-label="Navigation principale">
      <AppLink href="/catalogue?categorie=bougie" onNavigate={() => setOpen(false)}>Bougies</AppLink>
      <AppLink href="/catalogue?categorie=savon" onNavigate={() => setOpen(false)}>Savons</AppLink>
      <AppLink href="/catalogue?categorie=coffret" onNavigate={() => setOpen(false)}>Coffrets</AppLink>
      <AppLink href="/catalogue?categorie=fondant" onNavigate={() => setOpen(false)}>Fondants</AppLink>
      <AppLink href="/catalogue?categorie=diffuseur" onNavigate={() => setOpen(false)}>Diffuseurs</AppLink>
      <AppLink href="/galerie" onNavigate={() => setOpen(false)}>Galerie</AppLink>
      <AppLink href="/marches" onNavigate={() => setOpen(false)}>Marchés</AppLink>
      {/*<a href="/#histoire" onClick={() => setOpen(false)}>Notre histoire</a>*/}
    </nav>
    <AppLink className="shop-button" href="/catalogue"><ShoppingBag size={17} /> La boutique</AppLink>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open} aria-controls="main-navigation">{open ? <X /> : <Menu />}</button>
  </div></header></>
}

function Footer() {
  return (
  <footer id="contact" className="footer">
    <div className="footer-grid"><Logo /><div>
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
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><AtSign size={17} /> Instagram</a>
        <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} Douceur d’ici, conçu et développé par Laura Buil</span>
      <span>Fabriqué avec soin dans les Pyrénées</span>
      <div className="footer-legal-links">
        <AppLink href="/mentions-legales">Mentions légales</AppLink>
        <AppLink href="/admin">Administration</AppLink>
      </div>
    </div>
  </footer>
  )
}

function ProductCard({ product }: { product: Product }) {
  const colors = (product.product_colors ?? []).map((link) => link.color).filter(Boolean) as CatalogColor[]
  const fragrances = (product.product_fragrances ?? []).map((link) => link.fragrance).filter(Boolean) as CatalogFragrance[]
  const fragranceSummary = fragrances.length === 1 ? fragrances[0].name : fragrances.length > 1 ? `${fragrances.length} parfums au choix` : null
  const details = [fragranceSummary, formatProductFormat(product.weight)].filter(Boolean).join(' · ')
  const fromCatalogue = window.location.pathname.startsWith('/catalogue')
  const cataloguePath = fromCatalogue ? currentPathWithSearch() : '/catalogue'
  const openProduct = () => {
    if (fromCatalogue) {
      window.history.scrollRestoration = 'manual'
      catalogueReturnPosition = { path: cataloguePath, scrollY: window.scrollY }
    }
    navigate(`/produit/${product.slug}`, { cataloguePath })
  }
  return <article className="product-card"><button className="product-card-link" onClick={openProduct} aria-label={`Voir ${product.name}`}><div className="product-image-wrap"><img src={productPrimaryImage(product)} alt={product.name} loading="lazy" /><span>{productCategoryLabel(product)}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>{details || product.short_description}</p>{colors.length > 0 && <span className="mini-swatches" aria-label={`${colors.length} couleurs disponibles`}>{colors.slice(0, 6).map((color) => <i key={color.id} style={{ backgroundColor: color.hex_code }} title={color.name} />)}{colors.length > 6 && <small>+{colors.length - 6}</small>}</span>}</div>{product.price_visible !== false && <strong>{formatPrice(Number(product.price))}</strong>}</div></button></article>
}

function variantSummary(product: Product) {
  const colors = (product.product_colors ?? []).map((link) => link.color?.name).filter(Boolean)
  const fragrances = (product.product_fragrances ?? []).map((link) => link.fragrance?.name).filter(Boolean)
  return [fragrances.length ? fragrances.join(', ') : null, colors.length ? colors.join(', ') : null].filter(Boolean).join(' · ') || '—'
}

function FragranceComposition({ composition }: { composition: string }) {
  const marker = composition.match(/caract[eé]ristiques\s*:?/i)
  if (!marker || marker.index === undefined) return <div className="fragrance-composition"><div className="fragrance-description"><span>Description</span><p>{composition}</p></div></div>
  const description = composition.slice(0, marker.index).trim()
  const remainder = composition.slice(marker.index + marker[0].length)
  const safetyMarker = remainder.search(/informations? de s[eé]curit[eé]/i)
  const characteristicsText = safetyMarker >= 0 ? remainder.slice(0, safetyMarker) : remainder
  const safety = safetyMarker >= 0 ? remainder.slice(safetyMarker).replace(/^informations? de s[eé]curit[eé]\s*/i, '').trim() : ''
  const characteristics = characteristicsText.split(/(?:•|\n+)/).map((item) => item.trim()).filter(Boolean)
  const safetyLines = safety.split(/\n+/).map((item) => item.trim()).filter(Boolean)
  return <div className="fragrance-composition">{description && <div className="fragrance-description"><span>Description</span>{description.split(/\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}{characteristics.length > 0 && <div className="fragrance-characteristics"><span>Caractéristiques</span><ul>{characteristics.map((characteristic) => <li key={characteristic}><i aria-hidden="true">•</i><p>{characteristic}</p></li>)}</ul></div>}{safetyLines.length > 0 && <details className="fragrance-safety"><summary>Informations de sécurité</summary>{safetyLines.map((line) => <p key={line}>{line}</p>)}</details>}</div>
}

function usePublicProducts() {
  const [products, setProducts] = useState<Product[]>(supabase ? [] : demoProducts)
  useEffect(() => {
    if (!supabase) return
    supabase.from('products').select(PRODUCT_SELECT).eq('published', true).order('sort_order').then(({ data, error }) => {
      if (error) { console.error('[catalogue] Chargement des produits impossible', error); return }
      setProducts((data ?? []) as Product[])
    })
  }, [])
  return products
}

function Home() {
  useDocumentTitle('Bougies & créations artisanales des Pyrénées')
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
        <div className="button-row"><button className="button button--dark" onClick={() => navigate('/catalogue')}>Découvrir la collection</button>
          {/*<a className="button button--light" href="#histoire">Notre histoire</a>*/}
        </div>
      </div>
      <div className="hero-image"><img src="/assets/DSC0270655.JPG" alt="Bougies sculptées Douceur d’ici dans un décor naturel" /></div>
      <img className="botanical botanical--hero" src="/assets/branche-botanique.png" alt="" />
    </section>

    <section className="values" aria-label="Mes engagements">
      <article><Leaf /><div><h2>Fabrication artisanale</h2><p>Fait main en petits lots dans mon atelier.</p></div></article>
      <article><Sparkles /><div><h2>Ingrédients choisis</h2><p>Des matières sélectionnées avec attention.</p></div></article>
      <article><Recycle /><div><h2>Pots rechargeables</h2><p>Pensés pour être réutilisés, encore et encore.</p></div></article>
    </section>

    <section className="category-grid section-shell">
      <article className="category-card category-card--candles"><img src="/assets/DSC026881.JPG" alt="Bougies artisanales fleuries Douceur d’ici" /><div><h2>Bougies<br />artisanales</h2><p>Cires végétales & créations délicates.</p><button onClick={() => navigate('/catalogue?categorie=bougie')}>Découvrir <ArrowRight /></button></div></article>
      <article className="category-card category-card--soap"><img src="/assets/savon-lavande.png" alt="Savon artisanal à la lavande" /><div><h2>Savons<br />artisanaux</h2><p>Doux, généreux et fabriqués avec soin.</p><button onClick={() => navigate('/catalogue?categorie=savon')}>Découvrir <ArrowRight /></button></div></article>
    </section>

    <section id="recharge" className="recharge section-shell">
      <div className="recharge-copy"><h2>Donnez une seconde vie <em>à vos bougies</em></h2><p>Mes pots sont faits pour durer. Rapportez-les à l’atelier et faites-les remplir avec le parfum de votre choix.</p><a className="button button--dark" href="mailto:douceurdici@protonmail.com?subject=Recharge%20de%20ma%20bougie">En savoir plus</a></div>
      <div className="steps"><div><span>1.</span><Flame /><strong>Utilisez</strong><small>Profitez pleinement<br />de votre bougie.</small></div><ArrowRight /><div><span>2.</span><ShoppingBag /><strong>Rapportez</strong><small>Ramenez votre pot<br />à l’atelier.</small></div><ArrowRight /><div><span>3.</span><Recycle /><strong>Remplissez</strong><small>Nous le nettoyons<br />et le remplissons.</small></div></div>
    </section>

    <section className="featured section-shell"><div className="section-heading"><h2>Mes créations phares</h2><button onClick={() => navigate('/catalogue')}>Voir tout le catalogue <ArrowRight /></button></div><div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

    <section id="histoire" className="story section-shell">
      <div className="story-image"><img src="/assets/DSC02699.JPG" alt="Bougie ourson façonnée à la main par Douceur d’ici" /></div>
      <div className="story-copy">
        {/*<span className="eyebrow">Notre histoire</span>*/}
        <h2>Un atelier, <em>une passion</em></h2><p>Douceur d’ici est née au cœur des Pyrénées, de l’envie de créer des objets beaux, simples et responsables. Chaque pièce est imaginée et préparée à la main.</p>
        {/*<a href="mailto:douceurdici@protonmail.com">Découvrir notre histoire <ArrowRight /></a>*/}
      </div>
      <blockquote><span>“</span>La durabilité n’est pas une contrainte, c’est une promesse de douceur qui dure dans le temps.<small>♡</small></blockquote>
    </section>

    <section className="social-band">
      <div className="instagram"><div className="instagram-title"><h2>Sur Instagram <em>un peu d’inspiration</em></h2><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Voir le compte <ArrowRight /></a></div><div className="instagram-grid"><img src="/assets/DSC026835.JPG" alt="Bougie ourson jaune Douceur d’ici" /><img src="/assets/DSC026881.JPG" alt="Bougies fleuries dans leur panier" /><img src="/assets/DSC027065.JPG" alt="Bougies sculptées aux tons naturels" /><img src="/assets/DSC0270655.JPG" alt="Collection de bougies dans un décor naturel" /></div></div>
    </section>
  </main><Footer /></>
}

function Catalogue() {
  useDocumentTitle('Catalogue artisanal')
  const products = usePublicProducts()
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([])
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)
  const scrollRestored = useRef(false)
  const filter = normalizeCategorySlug(new URLSearchParams(window.location.search).get('categorie') ?? 'tous')
  useEffect(() => {
    if (!supabase) return
    supabase.from('catalog_categories').select('*').eq('active', true).order('sort_order').then(({ data }) => setCatalogCategories((data ?? []) as CatalogCategory[]))
  }, [])
  const productCategories = products.flatMap(productCategoryRecords)
  const categories = catalogCategories.length ? catalogCategories : [...new Map(productCategories.map((category) => [category.id, category])).values()]
  useEffect(() => {
    const savedScroll = Number(catalogueReturnPosition?.scrollY)
    if (scrollRestored.current || catalogueReturnPosition?.path !== currentPathWithSearch() || !products.length || (Boolean(supabase) && !catalogCategories.length) || !Number.isFinite(savedScroll)) return
    scrollRestored.current = true
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, behavior: 'auto' })
      catalogueReturnPosition = null
      window.history.scrollRestoration = 'auto'
    }))
  }, [products.length, catalogCategories.length])
  const roots = categories.filter((category) => !category.parent_id)
  const selectedCategory = categories.find((category) => category.slug === filter)
  const selectedRoot = selectedCategory?.parent_id ? roots.find((category) => category.id === selectedCategory.parent_id) : selectedCategory
  const children = selectedRoot ? categories.filter((category) => category.parent_id === selectedRoot.id) : []
  const filteredByCategory = filter === 'tous' ? products : products.filter((product) => {
    const linkedCategories = productCategoryRecords(product)
    if (!selectedCategory) return product.category === filter || linkedCategories.some((category) => category.slug === filter)
    if (selectedCategory.parent_id) return linkedCategories.some((category) => category.id === selectedCategory.id)
    return product.category === selectedCategory.slug || linkedCategories.some((category) => category.id === selectedCategory.id || category.parent_id === selectedCategory.id)
  })
  const normalizedSearch = search.trim().toLocaleLowerCase('fr')
  const filtered = normalizedSearch ? filteredByCategory.filter((product) => [product.name, product.short_description, productCategoryLabel(product)].some((value) => value.toLocaleLowerCase('fr').includes(normalizedSearch))) : filteredByCategory
  const visibleProducts = filtered.slice(0, visibleCount)
  const chooseFilter = (slug: string) => { setVisibleCount(12); navigate(slug === 'tous' ? '/catalogue' : `/catalogue?categorie=${encodeURIComponent(slug)}`, {}, 'preserve') }
  return <><Header /><main className="catalogue-page"><section className="catalogue-hero"><span className="eyebrow">La boutique</span><h1>Mes créations artisanales</h1><p>Des bougies, savons, coffrets, fondants et diffuseurs préparés en petites séries dans les Pyrénées.</p></section><section className="catalogue-content section-shell"><div className="catalogue-toolbar"><label><Search /><span className="sr-only">Rechercher une création</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(12) }} placeholder="Rechercher une création…" /></label><p aria-live="polite">{filtered.length} création{filtered.length > 1 ? 's' : ''}</p></div><div className="catalogue-filter-bar"><div className="filters" role="group" aria-label="Filtrer le catalogue"><button className={filter === 'tous' ? 'active' : ''} aria-pressed={filter === 'tous'} onClick={() => chooseFilter('tous')}>Tout</button>{roots.map((category) => <button key={category.id} className={selectedRoot?.id === category.id ? 'active' : ''} aria-pressed={selectedRoot?.id === category.id} onClick={() => chooseFilter(category.slug)}>{category.name}</button>)}</div>{children.length > 0 && <div className="subfilters" role="group" aria-label={`Sous-catégories de ${selectedRoot?.name}`}><button className={filter === selectedRoot?.slug ? 'active' : ''} aria-pressed={filter === selectedRoot?.slug} onClick={() => chooseFilter(selectedRoot!.slug)}>Toute la collection</button>{children.map((category) => <button key={category.id} className={filter === category.slug ? 'active' : ''} aria-pressed={filter === category.slug} onClick={() => chooseFilter(category.slug)}>{category.name}</button>)}</div>}</div>{filtered.length ? <><div className="product-grid product-grid--catalogue">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>{visibleProducts.length < filtered.length && <button className="button button--light catalogue-more" onClick={() => setVisibleCount((count) => count + 12)}>Voir plus de créations</button>}</> : <div className="empty-state"><Leaf /><h2>{normalizedSearch ? 'Aucune création trouvée.' : 'Cette collection arrive bientôt.'}</h2><p>{normalizedSearch ? 'Essayez un autre nom ou une autre collection.' : 'De nouvelles créations sont en préparation à l’atelier.'}</p></div>}</section></main><Footer /></>
}

function ProductDetailPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(demoProducts.find((item) => item.slug === slug) ?? null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  useDocumentTitle(product?.name ?? 'Création artisanale')
  useEffect(() => {
    if (!supabase) return
    supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('published', true).maybeSingle().then(({ data }) => { setProduct(data as Product | null); setLoading(false) })
  }, [slug])
  const allImages = useMemo(() => product ? [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order) : [], [product])
  const selectedColorImages = selectedColor ? allImages.filter((image) => image.color_id === selectedColor) : []
  const imageUrl = selectedImage && allImages.some((image) => image.image_url === selectedImage) ? selectedImage : selectedColorImages[0]?.image_url || allImages[0]?.image_url || (product ? productPrimaryImage(product) : '')
  if (loading) return <><Header /><main className="product-detail-loading"><LoaderCircle className="spin" /> Chargement de la création…</main><Footer /></>
  if (!product) return <><Header /><main className="product-detail-loading"><Leaf /><h1>Cette création n’est pas disponible.</h1><button className="button button--dark" onClick={() => navigate('/catalogue')}>Retour au catalogue</button></main><Footer /></>
  const colors = (product.product_colors ?? []).map((link) => link.color).filter(Boolean) as CatalogColor[]
  const selectedColorRecord = colors.find((color) => color.id === selectedColor)
  const fragrances = (product.product_fragrances ?? []).map((link) => link.fragrance).filter(Boolean) as CatalogFragrance[]
  const cataloguePath = typeof window.history.state?.cataloguePath === 'string' && window.history.state.cataloguePath.startsWith('/catalogue') ? window.history.state.cataloguePath : '/catalogue'
  const backToCatalogue = () => window.history.state?.cataloguePath ? window.history.back() : navigate(cataloguePath)
  return <><Header /><main className="product-detail"><button className="product-back" onClick={backToCatalogue}><ChevronLeft /> Retour au catalogue</button><div className="product-detail-grid"><section className="product-gallery"><div className="product-main-image"><img src={imageUrl} alt={selectedColorRecord ? `${product.name}, couleur ${selectedColorRecord.name}` : product.name} /></div>{selectedColorRecord && <p className="selected-color-preview"><span style={{ backgroundColor: selectedColorRecord.hex_code }} />Aperçu de la couleur <strong>{selectedColorRecord.name}</strong></p>}{allImages.length > 1 && <div className="product-thumbnails" aria-label="Toutes les photos du produit">{allImages.map((image) => { const imageColor = colors.find((color) => color.id === image.color_id); return <button key={image.id} className={image.image_url === imageUrl ? 'active' : ''} onClick={() => { setSelectedImage(image.image_url); setSelectedColor(image.color_id ?? null) }} aria-label={`Afficher la photo${imageColor ? `, couleur ${imageColor.name}` : ''}`}><img src={image.image_url} alt={image.alt_text || product.name} loading="lazy" />{imageColor && <small>{imageColor.name}</small>}</button> })}</div>}</section><section className="product-detail-copy"><span className="eyebrow">{productCategoryLabel(product)}</span><h1>{product.name}</h1><p className="product-lead">{product.short_description}</p>{product.price_visible && <strong className="product-price">{formatPrice(Number(product.price))}</strong>}<ProductDescription description={product.description} />{product.weight && <p className="product-format">Format : <strong>{formatProductFormat(product.weight)}</strong></p>}{colors.length > 0 && <div className="product-options"><h2>Couleurs disponibles</h2><p>Choisissez une couleur pour afficher sa photo. Toutes les autres photos restent accessibles sous l’image.</p><div className="color-swatches">{colors.map((color) => <button key={color.id} className={selectedColor === color.id ? 'active' : ''} onClick={() => { const nextColor = selectedColor === color.id ? null : color.id; setSelectedColor(nextColor); setSelectedImage(nextColor ? allImages.find((image) => image.color_id === nextColor)?.image_url ?? '' : '') }} aria-label={`Voir la couleur ${color.name}`} aria-pressed={selectedColor === color.id}><span style={{ backgroundColor: color.hex_code }} /><small>{color.name}</small></button>)}</div></div>}</section>{fragrances.length > 0 && <section className="product-fragrances"><header><span className="eyebrow">La signature olfactive</span><h2>Parfums & compositions</h2><p>Ouvrez un parfum pour consulter sa composition et ses informations.</p></header><div className="fragrance-list fragrance-list--gallery">{fragrances.map((fragrance, index) => <details key={fragrance.id} open={index === 0 ? true : undefined}><summary className="fragrance-heading"><span className="fragrance-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><strong>{fragrance.name}</strong></summary><FragranceComposition composition={fragrance.composition} /></details>)}</div></section>}</div></main><Footer /></>
}

function GalleryPage() {
  useDocumentTitle('Galerie')
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  useEffect(() => {
    if (!supabase) return
    supabase.from('gallery_images').select('*').eq('published', true).order('sort_order').then(({ data }) => { setImages((data ?? []) as GalleryImage[]); setLoading(false) })
  }, [])
  return <><Header /><main className="content-page"><header className="content-hero"><span className="eyebrow">L’univers Douceur d’ici</span><h1>Galerie</h1><p>Créations, matières et instants de l’atelier au fil des saisons.</p></header><section className="public-gallery section-shell">{loading ? <div className="page-loading"><LoaderCircle className="spin" /> Chargement des photos…</div> : images.length ? images.map((item) => <figure key={item.id}><img src={item.image_url} alt={item.alt_text || item.caption || 'Création Douceur d’ici'} loading="lazy" /><figcaption>{item.caption}</figcaption></figure>) : <div className="empty-state"><ImageIcon /><h2>La galerie se prépare.</h2><p>Les premières photos seront bientôt ajoutées.</p></div>}</section></main><Footer /></>
}

function MarketsPage() {
  useDocumentTitle('Calendrier des marchés')
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  useEffect(() => {
    if (!supabase) return
    supabase.from('markets').select('*').eq('published', true).gte('start_date', new Date().toISOString()).order('start_date').then(({ data }) => { setMarkets((data ?? []) as Market[]); setLoading(false) })
  }, [])
  const dateLabel = (date: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
  return <><Header /><main className="content-page"><header className="content-hero"><span className="eyebrow">Retrouvez-moi</span><h1>Calendrier des marchés</h1><p>Les prochaines dates où découvrir mes créations et me rencontrer.</p></header><section className="market-list section-shell">{loading ? <div className="page-loading"><LoaderCircle className="spin" /> Chargement du calendrier…</div> : markets.length ? markets.map((market) => <article key={market.id}><CalendarDays /><div><time dateTime={market.start_date}>{dateLabel(market.start_date)}</time><h2>{market.name}</h2><strong>{market.location}</strong>{market.details && <p>{market.details}</p>}<a className="market-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(market.location)}`} target="_blank" rel="noreferrer">Voir le lieu sur la carte <ArrowRight /></a></div></article>) : <div className="empty-state"><CalendarDays /><h2>Les prochaines dates arrivent.</h2><p>Le calendrier des marchés sera mis à jour prochainement.</p></div>}</section></main><Footer /></>
}

function LegalNoticePage() {
  useDocumentTitle('Mentions légales')
  return <><Header /><main className="legal-page">
    <header className="legal-heading"><span className="eyebrow">Informations légales</span><h1>Mentions légales</h1><p>Informations relatives à l’édition et au fonctionnement du site douceurdici.com.</p></header>
    <div className="legal-layout">
      <aside><p>Dernière mise à jour</p><strong>14 septembre 2026</strong><a href="mailto:douceurdici@protonmail.com">Nous contacter</a></aside>
      <div className="legal-content">
        <section><h2>1. Éditeur du site</h2><p>Le site <strong>douceurdici.com</strong> est édité par Laura Buil, conceptrice et développeuse d'applications web.</p><div className="legal-todo"><p>N° Siret 827 536 749 00027, Raison sociale Douceur d'ici, Entrepreneur individuel (EI).</p></div><p>Adresse électronique : <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a></p></section>
        <section><h2>2. Direction de la publication</h2><p>La direction de la publication est assurée par la personne responsable de Douceur d’ici.</p><div className="legal-todo"><p>Clara Tetart, directrice et propriétaire.</p></div></section>
        <section><h2>3. Hébergement</h2><p>Le site est hébergé par <strong>Hostinger International Limited</strong>, société privée à responsabilité limitée de droit chypriote, 61 Lordou Vironos Street, 6023 Larnaca, Chypre.</p><p><a href="https://www.hostinger.fr/" target="_blank" rel="noreferrer">www.hostinger.fr</a></p></section>
        <section><h2>4. Propriété intellectuelle</h2><p>Les textes, photographies, illustrations, éléments graphiques, logos et créations présentés sur ce site sont protégés par le droit de la propriété intellectuelle. Sauf autorisation écrite préalable, toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, est interdite.</p></section>
        <section><h2>5. Responsabilité</h2><p>Douceur d’ici veille à fournir des informations aussi exactes et à jour que possible. Ces informations sont données à titre indicatif et peuvent évoluer. Douceur d’ici ne peut garantir l’absence d’erreur ou l’accès continu au site.</p></section>
        <section><h2>6. Données personnelles</h2><p>Les messages envoyés à l’adresse de contact sont utilisés uniquement pour répondre à la demande reçue. Des données techniques peuvent être traitées par l’hébergeur pour assurer la sécurité et le bon fonctionnement du site.</p><p>Pour toute question ou pour exercer vos droits d’accès, de rectification, d’effacement, de limitation ou d’opposition, écrivez à <a href="mailto:douceurdici@protonmail.com">douceurdici@protonmail.com</a>.</p></section>
        <section><h2>7. Cookies et stockage local</h2><p>Le site public ne dépose pas de cookies publicitaires ou de mesure d’audience. L’espace d’administration utilise uniquement les mécanismes techniques nécessaires à l’authentification et à la sécurité de la session.</p></section>
        <section><h2>8. Liens externes</h2><p>Le site peut contenir des liens vers des services tiers. Douceur d’ici n’exerce aucun contrôle sur leur contenu ni sur leurs pratiques de confidentialité.</p></section>
      </div>
    </div>
  </main><Footer /></>
}

function NotFoundPage() {
  useDocumentTitle('Page introuvable')
  return <><Header /><main className="not-found"><Leaf /><span className="eyebrow">Erreur 404</span><h1>Cette page n’existe pas.</h1><p>La création ou la page que vous cherchez a peut-être été déplacée.</p><button className="button button--dark" onClick={() => navigate('/')}>Retour à l’accueil</button></main><Footer /></>
}

function Admin() {
  const [sessionUser, setSessionUser] = useState<string | null>(null)
  const [role, setRole] = useState<StaffRole | null>(null)
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
        const { data } = await client.from('admins').select('role,active').eq('user_id', user.id).maybeSingle()
        setRole(data?.active ? data.role as StaffRole : null)
      } else setRole(null)
      setChecking(false)
    }
    check()
    const { data } = client.auth.onAuthStateChange(() => check())
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return <AdminSetup />
  if (checking) return <div className="admin-loading"><LoaderCircle className="spin" /><span>Ouverture de l’atelier…</span></div>
  if (!sessionUser) return <AdminLogin onMessage={setMessage} message={message} />
  if (!role) return <div className="admin-denied"><Logo /><h1>Accès réservé</h1><p>Ce compte existe, mais il n’a pas encore été autorisé à administrer le catalogue.</p><button className="button button--dark" onClick={() => supabase?.auth.signOut()}>Changer de compte</button></div>
  return <AdminDashboard email={sessionUser} role={role} />
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

function AdminDashboard({ email, role }: { email: string; role: StaffRole }) {
  const [view, setView] = useState<AdminView>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null | 'new'>(null)
  const [notice, setNotice] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productStatus, setProductStatus] = useState<'all' | 'published' | 'draft'>('all')
  const loadProducts = async () => {
    const { data } = await supabase!.from('products').select(PRODUCT_SELECT).order('sort_order')
    setProducts((data ?? []) as Product[]); setLoading(false)
  }
  useEffect(() => {
    void supabase!.from('products').select(PRODUCT_SELECT).order('sort_order').then(({ data }) => {
      setProducts((data ?? []) as Product[])
      setLoading(false)
    })
  }, [])
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
        const { data, error } = await supabase!.from('products').select('id,name,category,category_id,price,price_visible,published,featured,product_categories(category_id),product_colors(color_id),product_fragrances(fragrance_id),product_images(image_url,color_id)').order('sort_order')
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
          category_ids: { type: 'array', minItems: 1, items: { type: 'string', minLength: 36, maxLength: 36 }, uniqueItems: true },
          short_description: { type: 'string' }, description: { type: 'string' },
          price: { type: 'number', minimum: 0 }, weight: { type: 'string' },
          price_visible: { type: 'boolean' }, image_url: { type: 'string' }, published: { type: 'boolean' }, featured: { type: 'boolean' },
          color_ids: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          fragrance_ids: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        },
        required: ['name', 'category_ids', 'short_description', 'description', 'price'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input) {
        if (!input || typeof input !== 'object') throw new Error('Les informations de la création sont invalides.')
        const value = input as Record<string, unknown>
        const categoryIds = Array.isArray(value.category_ids) ? value.category_ids.filter((id): id is string => typeof id === 'string') : []
        if (typeof value.name !== 'string' || value.name.trim().length < 2 || !categoryIds.length || typeof value.price !== 'number' || value.price < 0 || typeof value.short_description !== 'string' || typeof value.description !== 'string') throw new Error('Les champs obligatoires sont invalides.')
        const slug = value.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const { data: availableCategories } = await supabase!.from('catalog_categories').select('id,slug,parent_id').in('id', categoryIds)
        if (!availableCategories || availableCategories.length !== categoryIds.length) throw new Error('Une catégorie sélectionnée est invalide.')
        const category = availableCategories.find((item) => item.id === categoryIds[0])!
        const { data: parent } = category.parent_id ? await supabase!.from('catalog_categories').select('slug').eq('id', category.parent_id).single() : { data: null }
        const { data, error } = await supabase!.from('products').insert({ name: value.name.trim(), slug, category: parent?.slug ?? category.slug, category_id: category.id, short_description: value.short_description, description: value.description, price: value.price, price_visible: value.price_visible !== false, weight: typeof value.weight === 'string' ? value.weight : null, image_url: typeof value.image_url === 'string' ? value.image_url : '', published: value.published !== false, featured: value.featured === true }).select('id,name,slug').single()
        if (error) throw new Error('La création n’a pas pu être ajoutée.')
        const colors = Array.isArray(value.color_ids) ? value.color_ids.filter((id): id is string => typeof id === 'string') : []
        const fragrances = Array.isArray(value.fragrance_ids) ? value.fragrance_ids.filter((id): id is string => typeof id === 'string') : []
        const results = await Promise.all([
          supabase!.from('product_categories').insert(categoryIds.map((category_id) => ({ product_id: data.id, category_id }))),
          colors.length ? supabase!.from('product_colors').insert(colors.map((color_id) => ({ product_id: data.id, color_id }))) : Promise.resolve({ error: null }),
          fragrances.length ? supabase!.from('product_fragrances').insert(fragrances.map((fragrance_id) => ({ product_id: data.id, fragrance_id }))) : Promise.resolve({ error: null }),
        ])
        if (results.some((result) => result.error)) {
          await supabase!.from('products').delete().eq('id', data.id)
          throw new Error('Les options de la création n’ont pas pu être ajoutées.')
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
    settings: { title: 'Paramètres', description: 'Gérez les catégories, couleurs, parfums, comptes et options de la boutique.' },
  }
  const navItems: { id: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'products', label: 'Produits', icon: ShoppingBag },
    { id: 'gallery', label: 'Galerie photos', icon: ImageIcon },
    { id: 'markets', label: 'Calendrier des marchés', icon: CalendarDays },
    ...(role === 'admin' ? [{ id: 'settings' as const, label: 'Paramètres', icon: Settings }] : []),
  ]
  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase('fr')
  const visibleAdminProducts = products.filter((product) => (!normalizedProductSearch || product.name.toLocaleLowerCase('fr').includes(normalizedProductSearch)) && (productStatus === 'all' || (productStatus === 'published' ? product.published : !product.published)))
  return <div className="admin-shell"><aside className="admin-sidebar"><Logo compact /><nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon /> {label}</button>)}<button onClick={() => navigate('/')}><ArrowRight /> Voir le site</button></nav><div className="admin-account"><small>{role === 'admin' ? 'Administrateur' : 'Exploitant'}</small><span>{email}</span><button onClick={() => supabase!.auth.signOut()}><LogOut /> Se déconnecter</button></div></aside><main className="admin-main"><header><div><span className="eyebrow">Administration</span><h1>{labels[view].title}</h1><p>{labels[view].description}</p></div>{view === 'products' && <button className="button button--dark" onClick={() => setEditing('new')}><PackagePlus /> Ajouter un produit</button>}</header>{notice && view === 'products' && <div className="admin-notice" role="status"><Check />{notice}<button onClick={() => setNotice('')} aria-label="Fermer le message"><X /></button></div>}<div className="admin-view">{view === 'overview' && <AdminOverview productCount={products.length} onOpen={setView} />}{view === 'products' && (loading ? <div className="admin-loading-inline"><LoaderCircle className="spin" /> Chargement du catalogue…</div> : <><div className="admin-product-toolbar"><label><Search /><span className="sr-only">Rechercher un produit</span><input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Rechercher un produit…" /></label><label>Visibilité<select value={productStatus} onChange={(event) => setProductStatus(event.target.value as typeof productStatus)}><option value="all">Tous les produits</option><option value="published">En ligne</option><option value="draft">Brouillons</option></select></label><p>{visibleAdminProducts.length} résultat{visibleAdminProducts.length > 1 ? 's' : ''}</p></div><div className="admin-table-wrap"><table><thead><tr><th>Produit</th><th>Parfums & couleurs</th><th>Prix</th><th>Visibilité</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleAdminProducts.map((product) => <tr key={product.id}><td><div className="table-product"><img src={productPrimaryImage(product)} alt="" loading="lazy" /><div><strong>{product.name}</strong><small>{productCategoryLabel(product)} · {(product.product_images ?? []).length} photo{(product.product_images ?? []).length > 1 ? 's' : ''}</small></div></div></td><td>{variantSummary(product)}</td><td>{product.price_visible ? formatPrice(Number(product.price)) : <span className="status">Prix masqué</span>}</td><td><span className={product.published ? 'status status--published' : 'status'}>{product.published ? 'En ligne' : 'Brouillon'}</span></td><td><div className="row-actions"><button onClick={() => setEditing(product)} aria-label={`Modifier ${product.name}`}><Pencil /></button><button onClick={() => remove(product)} aria-label={`Supprimer ${product.name}`}><Trash2 /></button></div></td></tr>)}</tbody></table>{!visibleAdminProducts.length && <div className="empty-state"><Search /><h2>Aucun produit trouvé.</h2><p>Modifiez la recherche ou le filtre de visibilité.</p></div>}</div></>)}{view === 'gallery' && <AdminGallery />}{view === 'markets' && <AdminMarkets />}{view === 'settings' && role === 'admin' && <AdminSettings />}</div></main><AnimatePresence>{editing && <ProductEditor product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Catalogue mis à jour.'); loadProducts() }} />}</AnimatePresence></div>
}

type PendingProductImage = { localId: string; file: File; color_id: string }

function ProductEditor({ product, onClose, onSaved }: { product: Product | null, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(product ? { ...emptyProduct, ...product } : emptyProduct)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [colors, setColors] = useState<CatalogColor[]>([])
  const [fragrances, setFragrances] = useState<CatalogFragrance[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const linked = (product?.product_categories ?? []).map((link) => link.category_id)
    return linked.length ? linked : product?.category_id ? [product.category_id] : []
  })
  const [selectedColors, setSelectedColors] = useState<string[]>(() => [...new Set([...(product?.product_colors ?? []).map((link) => link.color_id), ...(product?.product_images ?? []).map((image) => image.color_id).filter((id): id is string => Boolean(id))])])
  const [selectedFragrances, setSelectedFragrances] = useState<string[]>((product?.product_fragrances ?? []).map((link) => link.fragrance_id))
  const [images, setImages] = useState<ProductImage[]>([...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order))
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([])
  const initialPrimary = product?.product_images?.find((image) => image.is_primary)?.id
  const [primaryImageKey, setPrimaryImageKey] = useState(initialPrimary ? `existing:${initialPrimary}` : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  const panelRef = useRef<HTMLElement | null>(null)
  const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    Promise.all([
      supabase!.from('catalog_categories').select('*').order('sort_order'),
      supabase!.from('catalog_colors').select('*').order('sort_order'),
      supabase!.from('catalog_fragrances').select('*').order('sort_order'),
    ]).then(([categoryResult, colorResult, fragranceResult]) => {
      const availableCategories = (categoryResult.data ?? []) as CatalogCategory[]
      setCategories(availableCategories); setColors((colorResult.data ?? []) as CatalogColor[]); setFragrances((fragranceResult.data ?? []) as CatalogFragrance[])
      const defaultCategory = availableCategories.find((category) => !category.parent_id && category.active) ?? availableCategories.find((category) => category.active)
      if (defaultCategory) {
        setForm((current) => current.category_id ? current : { ...current, category_id: defaultCategory.id })
        setSelectedCategories((current) => current.length ? current : [defaultCategory.id])
      }
    })
  }, [])

  const toggleChoice = (value: string, selected: string[], setter: (values: string[]) => void) => setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  const toggleCategory = (categoryId: string) => {
    const next = selectedCategories.includes(categoryId) ? selectedCategories.filter((id) => id !== categoryId) : [...selectedCategories, categoryId]
    setSelectedCategories(next)
    if (!next.includes(form.category_id ?? '')) update('category_id', next[0] ?? null)
  }
  const linkPhotoColor = (colorId: string) => {
    if (colorId) setSelectedColors((current) => current.includes(colorId) ? current : [...current, colorId])
  }
  const removeExistingImage = (image: ProductImage) => { setDirty(true); setImages((current) => current.filter((item) => item.id !== image.id)); setRemovedImageIds((current) => [...current, image.id]); if (primaryImageKey === `existing:${image.id}`) setPrimaryImageKey('') }
  const requestClose = () => {
    if (!dirtyRef.current || window.confirm('Quitter sans enregistrer vos modifications ?')) onClose()
  }

  useEffect(() => { dirtyRef.current = dirty }, [dirty])
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (!dirtyRef.current || window.confirm('Quitter sans enregistrer vos modifications ?'))) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previouslyFocused?.focus() }
  }, [onClose])

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    const category = categories.find((item) => item.id === (selectedCategories.includes(form.category_id ?? '') ? form.category_id : selectedCategories[0]))
    if (!category || !selectedCategories.length) { setError('Sélectionnez au moins une catégorie.'); setSaving(false); return }
    const rootCategory = category.parent_id ? categories.find((item) => item.id === category.parent_id) : category
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      category: rootCategory?.slug ?? category.slug,
      category_id: category.id,
      short_description: form.short_description,
      description: form.description,
      price: Number(form.price),
      price_visible: form.price_visible,
      color: '',
      scent: '',
      composition: '',
      weight: form.weight || null,
      image_url: form.image_url,
      featured: form.featured,
      published: form.published,
      sort_order: form.sort_order,
    }
    const query = product ? supabase!.from('products').update(payload).eq('id', product.id).select('id').single() : supabase!.from('products').insert(payload).select('id').single()
    const { data: savedProduct, error: saveError } = await query
    if (saveError || !savedProduct) { setError(saveError?.code === '23505' ? 'Un produit utilise déjà ce nom.' : 'Le produit n’a pas pu être enregistré.'); setSaving(false); return }

    await Promise.all([supabase!.from('product_categories').delete().eq('product_id', savedProduct.id), supabase!.from('product_colors').delete().eq('product_id', savedProduct.id), supabase!.from('product_fragrances').delete().eq('product_id', savedProduct.id)])
    const photoColorIds = [...images.map((image) => image.color_id), ...pendingImages.map((image) => image.color_id)].filter((id): id is string => Boolean(id))
    const savedColorIds = [...new Set([...selectedColors, ...photoColorIds])]
    const optionResults = await Promise.all([
      supabase!.from('product_categories').insert(selectedCategories.map((category_id) => ({ product_id: savedProduct.id, category_id }))),
      savedColorIds.length ? supabase!.from('product_colors').insert(savedColorIds.map((color_id) => ({ product_id: savedProduct.id, color_id }))) : Promise.resolve({ error: null }),
      selectedFragrances.length ? supabase!.from('product_fragrances').insert(selectedFragrances.map((fragrance_id) => ({ product_id: savedProduct.id, fragrance_id }))) : Promise.resolve({ error: null }),
    ])
    if (optionResults.some((result) => result.error)) { setError('Le produit est enregistré, mais ses catégories ou ses options n’ont pas pu être mises à jour.'); setSaving(false); return }

    if (removedImageIds.length) await supabase!.from('product_images').delete().in('id', removedImageIds)
    if (images.length) {
      await supabase!.from('product_images').update({ is_primary: false }).eq('product_id', savedProduct.id)
      const fallbackPrimary = primaryImageKey || `existing:${images[0].id}`
      await Promise.all(images.map((image, index) => supabase!.from('product_images').update({ color_id: image.color_id || null, is_primary: fallbackPrimary === `existing:${image.id}`, sort_order: index, alt_text: image.alt_text || form.name }).eq('id', image.id)))
    }

    const { data: { user } } = await supabase!.auth.getUser()
    const uploaded: { localId: string; image_url: string }[] = []
    for (const pending of pendingImages) {
      const safeName = pending.file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
      const path = `${user!.id}/${crypto.randomUUID()}-${safeName}`
      const upload = await supabase!.storage.from('product-images').upload(path, pending.file, { cacheControl: '3600', upsert: false })
      if (upload.error) { setError('Une des photos n’a pas pu être envoyée.'); setSaving(false); return }
      uploaded.push({ localId: pending.localId, image_url: supabase!.storage.from('product-images').getPublicUrl(path).data.publicUrl })
    }
    const fallbackPendingPrimary = !primaryImageKey && images.length === 0 ? pendingImages[0]?.localId : null
    if (pendingImages.length) {
      const { error: imageError } = await supabase!.from('product_images').insert(pendingImages.map((pending, index) => ({ product_id: savedProduct.id, color_id: pending.color_id || null, image_url: uploaded.find((item) => item.localId === pending.localId)!.image_url, alt_text: form.name, is_primary: primaryImageKey === `pending:${pending.localId}` || fallbackPendingPrimary === pending.localId, sort_order: images.length + index })))
      if (imageError) { setError('Les photos ont été envoyées mais n’ont pas pu être associées au produit.'); setSaving(false); return }
    }
    const primaryExisting = images.find((image) => (primaryImageKey || `existing:${images[0]?.id}`) === `existing:${image.id}`)?.image_url
    const primaryPendingId = primaryImageKey.startsWith('pending:') ? primaryImageKey.replace('pending:', '') : fallbackPendingPrimary
    const primaryPending = uploaded.find((item) => item.localId === primaryPendingId)?.image_url
    await supabase!.from('products').update({ image_url: primaryPending ?? primaryExisting ?? (images.length || pendingImages.length ? form.image_url : '') }).eq('id', savedProduct.id)
    setDirty(false); onSaved(); setSaving(false)
  }

  const activeCategories = categories.filter((item) => item.active || selectedCategories.includes(item.id))
  const roots = categories.filter((item) => !item.parent_id)
  return <motion.div className="editor-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }}><motion.section ref={panelRef} tabIndex={-1} className="editor-panel" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} aria-modal="true" role="dialog" aria-labelledby="editor-title"><header><div><span className="eyebrow">Catalogue</span><h2 id="editor-title">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2></div><button onClick={requestClose} aria-label="Fermer"><X /></button></header><form onSubmit={submit} onChangeCapture={() => setDirty(true)}>
    <label>Nom du produit<input value={form.name} onChange={(event) => { update('name', event.target.value); if (!product) update('slug', slugify(event.target.value)) }} required /></label>
    <fieldset className="product-category-choice"><legend>Catégories du produit</legend><p>Cochez toutes les collections dans lesquelles ce produit doit apparaître.</p><div className="product-category-groups">{roots.filter((root) => root.active || selectedCategories.includes(root.id) || activeCategories.some((item) => item.parent_id === root.id)).map((root) => { const children = activeCategories.filter((item) => item.parent_id === root.id); return <section key={root.id}><label className={`product-category-root ${selectedCategories.includes(root.id) ? 'selected' : ''}`}><input type="checkbox" checked={selectedCategories.includes(root.id)} onChange={() => toggleCategory(root.id)} /><span><strong>{root.name}</strong><small>Collection principale</small></span></label>{children.length > 0 && <div className="product-subcategory-choices">{children.map((child) => <label key={child.id} className={selectedCategories.includes(child.id) ? 'selected' : ''}><input type="checkbox" checked={selectedCategories.includes(child.id)} onChange={() => toggleCategory(child.id)} />{child.name}</label>)}</div>}</section> })}</div></fieldset>
    <label>Prix en €<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', Number(event.target.value))} required /></label>
    <fieldset className="catalog-choice"><legend>Couleurs disponibles</legend><p>Les couleurs sont indépendantes des parfums.</p><div className="choice-grid">{colors.filter((item) => item.active || selectedColors.includes(item.id)).map((color) => <label key={color.id} className={selectedColors.includes(color.id) ? 'selected' : ''}><input type="checkbox" checked={selectedColors.includes(color.id)} onChange={() => toggleChoice(color.id, selectedColors, setSelectedColors)} /><span className="color-chip" style={{ backgroundColor: color.hex_code }} />{color.name}</label>)}</div>{!colors.length && <small>Ajoutez d’abord des couleurs dans Paramètres.</small>}</fieldset>
    <fieldset className="catalog-choice"><legend>Parfums proposés</legend><p>La composition affichée vient automatiquement du parfum sélectionné.</p><div className="fragrance-choice-grid">{fragrances.filter((item) => item.active || selectedFragrances.includes(item.id)).map((fragrance) => <label key={fragrance.id} className={selectedFragrances.includes(fragrance.id) ? 'selected' : ''}><input type="checkbox" checked={selectedFragrances.includes(fragrance.id)} onChange={() => toggleChoice(fragrance.id, selectedFragrances, setSelectedFragrances)} /><span><strong>{fragrance.name}</strong><small>{fragrance.composition}</small></span></label>)}</div>{!fragrances.length && <small>Ajoutez d’abord des parfums dans Paramètres.</small>}</fieldset>
    <label>Description courte<input value={form.short_description} onChange={(event) => update('short_description', event.target.value)} placeholder="Une phrase visible dans le catalogue" required /></label><label>Description détaillée<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} required /></label><div className="form-grid"><label>Poids / format<input value={form.weight ?? ''} onChange={(event) => update('weight', event.target.value)} placeholder="180 g" /></label><label>Ordre d’affichage<input type="number" value={form.sort_order} onChange={(event) => update('sort_order', Number(event.target.value))} /></label></div>
    <fieldset className="product-images-editor"><legend>Galerie du produit</legend><p>Ajoutez plusieurs photos, puis indiquez la couleur représentée sur chacune d’elles.</p><label className="multi-upload"><Upload />Ajouter des photos<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { const additions = Array.from(event.target.files ?? []).map((file) => ({ localId: crypto.randomUUID(), file, color_id: '' })); setPendingImages((current) => [...current, ...additions]); event.currentTarget.value = '' }} /></label><div className="product-image-list">{images.map((image) => <article key={image.id}><img src={image.image_url} alt={image.alt_text} /><div><label className="photo-color-link"><span>Couleur montrée sur cette photo</span><select aria-label={`Couleur de la photo ${image.alt_text || form.name}`} value={image.color_id ?? ''} onChange={(event) => { const colorId = event.target.value; linkPhotoColor(colorId); setImages((current) => current.map((item) => item.id === image.id ? { ...item, color_id: colorId || null } : item)) }}><option value="">Photo commune à toutes les couleurs</option>{colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}</select></label><label><input type="radio" name="primary-image" checked={primaryImageKey === `existing:${image.id}` || (!primaryImageKey && image === images[0])} onChange={() => setPrimaryImageKey(`existing:${image.id}`)} /> Photo principale</label></div><button type="button" onClick={() => removeExistingImage(image)} aria-label="Retirer cette photo"><Trash2 /></button></article>)}{pendingImages.map((pending) => <article key={pending.localId}><div className="pending-image-name"><ImageIcon />{pending.file.name}</div><div><label className="photo-color-link"><span>Couleur montrée sur cette photo</span><select aria-label={`Couleur de la photo ${pending.file.name}`} value={pending.color_id} onChange={(event) => { const colorId = event.target.value; linkPhotoColor(colorId); setPendingImages((current) => current.map((item) => item.localId === pending.localId ? { ...item, color_id: colorId } : item)) }}><option value="">Photo commune à toutes les couleurs</option>{colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}</select></label><label><input type="radio" name="primary-image" checked={primaryImageKey === `pending:${pending.localId}` || (!primaryImageKey && !images.length && pending === pendingImages[0])} onChange={() => setPrimaryImageKey(`pending:${pending.localId}`)} /> Photo principale</label></div><button type="button" onClick={() => { setPendingImages((current) => current.filter((item) => item.localId !== pending.localId)); if (primaryImageKey === `pending:${pending.localId}`) setPrimaryImageKey('') }} aria-label="Retirer cette photo"><Trash2 /></button></article>)}</div></fieldset>
    <div className="switches"><label><input type="checkbox" checked={form.price_visible} onChange={(event) => update('price_visible', event.target.checked)} /><span />Afficher le prix sur le site</label><label><input type="checkbox" checked={form.published} onChange={(event) => update('published', event.target.checked)} /><span />Visible dans la boutique</label><label><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /><span />Afficher parmi les créations phares</label></div>{error && <div className="form-error">{error}</div>}
    <footer>
      <button type="button" className="button button--light" onClick={requestClose}>Annuler</button>
      <button className="button button--dark" disabled={saving}>{saving ? <><LoaderCircle className="spin" /> Enregistrement…</> : 'Enregistrer'}</button>
    </footer>
  </form></motion.section></motion.div>
}

export default function App() {
  const path = usePath()
  const pathname = path.split('?')[0]
  const page = pathname.startsWith('/admin') ? <Admin /> : pathname.startsWith('/produit/') ? <ProductDetailPage slug={decodeURIComponent(pathname.replace('/produit/', ''))} /> : pathname.startsWith('/catalogue') ? <Catalogue /> : pathname.startsWith('/galerie') ? <GalleryPage /> : pathname.startsWith('/marches') ? <MarketsPage /> : pathname.startsWith('/mentions-legales') ? <LegalNoticePage /> : pathname === '/' ? <Home /> : <NotFoundPage />
  return page
}
