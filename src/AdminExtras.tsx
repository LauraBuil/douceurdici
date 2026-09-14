import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDown, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, Image as ImageIcon, LoaderCircle, MapPin, Pencil, Plus, Save, ShoppingBag, Trash2 } from 'lucide-react'
import type { GalleryImage, Market } from './data'
import { supabase } from './lib/supabase'

export type AdminView = 'overview' | 'products' | 'gallery' | 'markets' | 'settings'

export function AdminOverview({ onOpen, productCount }: { onOpen: (view: AdminView) => void; productCount: number }) {
  const [counts, setCounts] = useState({ gallery: 0, markets: 0 })
  useEffect(() => {
    Promise.all([
      supabase!.from('gallery_images').select('id', { count: 'exact', head: true }),
      supabase!.from('markets').select('id', { count: 'exact', head: true }),
    ]).then(([gallery, markets]) => { setCounts({ gallery: gallery.count ?? 0, markets: markets.count ?? 0 }) })
  }, [])
  const cards = [
    { view: 'products' as const, label: 'Produits', value: productCount, unit: 'créations', icon: ShoppingBag },
    { view: 'gallery' as const, label: 'Galerie photos', value: counts.gallery, unit: 'photos', icon: ImageIcon },
    { view: 'markets' as const, label: 'Calendrier des marchés', value: counts.markets, unit: 'dates', icon: CalendarDays },
  ]
  return <div className="admin-overview"><div className="admin-cards">{cards.map(({ view, label, value, unit, icon: Icon }) => <button key={view} onClick={() => onOpen(view)}><Icon /><span>{label}</span><strong>{value}</strong><small>{unit}</small></button>)}</div><section className="admin-help"><h2>Comment ça marche</h2><ul><li>Un contenu en <strong>brouillon</strong> reste invisible sur le site.</li><li>Les <strong>couleurs</strong> sont indépendantes des parfums et s’affichent sous forme de nuancier.</li><li>La <strong>composition</strong> est enregistrée une seule fois avec son parfum, puis réutilisée sur les produits.</li><li>Chaque produit peut présenter plusieurs photos et associer une photo à une couleur.</li><li>Vous pouvez enregistrer un prix puis choisir de le <strong>masquer</strong> en attendant la boutique en ligne.</li></ul></section></div>
}

export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const load = async () => {
    const { data } = await supabase!.from('gallery_images').select('*').order('sort_order')
    setImages((data ?? []) as GalleryImage[]); setLoading(false)
  }
  useEffect(() => {
    void supabase!.from('gallery_images').select('*').order('sort_order').then(({ data }) => {
      setImages((data ?? []) as GalleryImage[])
      setLoading(false)
    })
  }, [])
  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) return
    setSaving(true); setNotice('')
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
    const path = `${crypto.randomUUID()}-${safeName}`
    const upload = await supabase!.storage.from('gallery-images').upload(path, file, { cacheControl: '3600' })
    if (upload.error) { setNotice('La photo n’a pas pu être envoyée.'); setSaving(false); return }
    const imageUrl = supabase!.storage.from('gallery-images').getPublicUrl(path).data.publicUrl
    const { error } = await supabase!.from('gallery_images').insert({ image_url: imageUrl, caption, alt_text: altText, published, sort_order: images.length })
    if (error) setNotice('La photo n’a pas pu être ajoutée.')
    else { setFile(null); setCaption(''); setAltText(''); setNotice('Photo ajoutée à la galerie.'); await load() }
    setSaving(false)
  }
  const save = async (image: GalleryImage) => {
    const { error } = await supabase!.from('gallery_images').update({ caption: image.caption, alt_text: image.alt_text, published: image.published, sort_order: image.sort_order }).eq('id', image.id)
    setNotice(error ? 'Les changements n’ont pas pu être enregistrés.' : 'Galerie mise à jour.')
  }
  const remove = async (image: GalleryImage) => {
    if (!window.confirm('Supprimer cette photo de la galerie ?')) return
    const { error } = await supabase!.from('gallery_images').delete().eq('id', image.id)
    if (error) setNotice('La photo n’a pas pu être supprimée.')
    else { setNotice('Photo supprimée.'); await load() }
  }
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const current = next[index]
    next[index] = { ...next[target], sort_order: index }
    next[target] = { ...current, sort_order: target }
    setImages(next)
    void Promise.all([save(next[index]), save(next[target])])
  }
  return <div className="admin-module"><form className="admin-inline-form" onSubmit={add}><div><h2>Ajouter une photo</h2><p>Choisissez une image, ajoutez une légende et publiez-la quand elle est prête.</p></div><label>Photo<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label>Légende<input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Bougie fleurie coulée à la main" /></label><label>Description de l’image<input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Décrivez la photo en quelques mots" /></label><label className="admin-check"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Publier immédiatement</label><button className="button button--dark" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />} Ajouter la photo</button></form>{notice && <p className="admin-notice">{notice}</p>}{loading ? <div className="admin-loading-inline"><LoaderCircle className="spin" /> Chargement de la galerie…</div> : images.length ? <div className="admin-gallery-grid">{images.map((item, index) => <article key={item.id} className={!item.published ? 'is-draft' : ''}><img src={item.image_url} alt="" /><div><label>Légende<input value={item.caption} onChange={(event) => setImages((current) => current.map((image) => image.id === item.id ? { ...image, caption: event.target.value } : image))} /></label><label>Description<input value={item.alt_text} onChange={(event) => setImages((current) => current.map((image) => image.id === item.id ? { ...image, alt_text: event.target.value } : image))} /></label><label className="admin-check"><input type="checkbox" checked={item.published} onChange={(event) => setImages((current) => current.map((image) => image.id === item.id ? { ...image, published: event.target.checked } : image))} /> {item.published ? 'En ligne' : 'Brouillon'}</label><div className="admin-gallery-actions"><button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Monter"><ArrowUp /></button><button onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label="Descendre"><ArrowDown /></button><button onClick={() => void save(item)}><Save /> Enregistrer</button><button className="danger" onClick={() => void remove(item)}><Trash2 /></button></div></div></article>)}</div> : <div className="empty-state"><ImageIcon /><h2>Votre galerie est prête.</h2><p>Ajoutez votre première photo ci-dessus.</p></div>}</div>
}

const emptyMarket = { name: '', location: '', start_date: '', end_date: '', details: '', published: true }

export function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [form, setForm] = useState(emptyMarket)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const load = async () => {
    const { data } = await supabase!.from('markets').select('*').order('start_date')
    setMarkets((data ?? []) as Market[]); setLoading(false)
  }
  useEffect(() => {
    void supabase!.from('markets').select('*').order('start_date').then(({ data }) => {
      setMarkets((data ?? []) as Market[])
      setLoading(false)
    })
  }, [])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setNotice('')
    const payload = { ...form, start_date: new Date(form.start_date).toISOString(), end_date: form.end_date ? new Date(form.end_date).toISOString() : null }
    const query = editingId ? supabase!.from('markets').update(payload).eq('id', editingId) : supabase!.from('markets').insert(payload)
    const { error } = await query
    if (error) setNotice('La date n’a pas pu être enregistrée.')
    else { setForm(emptyMarket); setEditingId(null); setNotice('Calendrier mis à jour.'); await load() }
    setSaving(false)
  }
  const edit = (market: Market) => {
    const localValue = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
    setEditingId(market.id); setForm({ name: market.name, location: market.location, start_date: localValue(market.start_date), end_date: localValue(market.end_date), details: market.details, published: market.published })
  }
  const remove = async (market: Market) => {
    if (!window.confirm(`Supprimer « ${market.name} » du calendrier ?`)) return
    const { error } = await supabase!.from('markets').delete().eq('id', market.id)
    setNotice(error ? 'La date n’a pas pu être supprimée.' : 'Date supprimée.')
    if (!error) await load()
  }
  const days = useMemo(() => {
    const year = month.getFullYear(), monthIndex = month.getMonth()
    const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
    const count = new Date(year, monthIndex + 1, 0).getDate()
    return [...Array(firstOffset).fill(null), ...Array.from({ length: count }, (_, index) => new Date(year, monthIndex, index + 1))]
  }, [month])
  const scheduled = (day: Date) => markets.some((market) => { const date = new Date(market.start_date); return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate() })
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(month)
  const dateLabel = (date: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
  return <div className="admin-module"><div className="admin-calendar"><header><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mois précédent"><ChevronLeft /></button><h2>{monthLabel}</h2><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mois suivant"><ChevronRight /></button></header><div className="admin-calendar-grid">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((day) => <strong key={day}>{day}</strong>)}{days.map((day, index) => day ? <span key={day.toISOString()} className={scheduled(day) ? 'has-market' : ''}>{day.getDate()}</span> : <i key={`empty-${index}`} />)}</div></div><form className="admin-inline-form market-form" onSubmit={submit}><div><h2>{editingId ? 'Modifier le marché' : 'Ajouter un marché'}</h2><p>Renseignez le lieu, la date et les informations utiles aux visiteurs.</p></div><label>Nom du marché<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Lieu<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required /></label><div className="form-grid"><label>Début<input type="datetime-local" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} required /></label><label>Fin, facultative<input type="datetime-local" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} /></label></div><label>Informations<textarea rows={3} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Horaires, emplacement, accès…" /></label><label className="admin-check"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publier sur le site</label><div className="button-row">{editingId && <button type="button" className="button button--light" onClick={() => { setEditingId(null); setForm(emptyMarket) }}>Annuler</button>}<button className="button button--dark" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} Enregistrer</button></div></form>{notice && <p className="admin-notice">{notice}</p>}{loading ? <div className="admin-loading-inline"><LoaderCircle className="spin" /> Chargement du calendrier…</div> : <div className="admin-market-list">{markets.map((market) => <article key={market.id} className={!market.published ? 'is-draft' : ''}><CalendarDays /><div><time>{dateLabel(market.start_date)}</time><h3>{market.name}</h3><p><MapPin /> {market.location}</p><small>{market.published ? 'Publié' : 'Brouillon'}</small></div><div><button onClick={() => edit(market)}><Pencil /> Modifier</button><button className="danger" onClick={() => void remove(market)}><Trash2 /></button></div></article>)}</div>}</div>
}
