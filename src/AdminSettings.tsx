import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { FolderTree, LoaderCircle, Palette, Plus, ShoppingCart, SprayCan, UserPlus, Users } from 'lucide-react'
import type { CatalogCategory, CatalogColor, CatalogFragrance, StaffAccount, StaffRole } from './data'
import { supabase } from './lib/supabase'

type SettingsTab = 'categories' | 'colors' | 'fragrances' | 'accounts' | 'shop'
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('categories')
  const tabs = [
    { id: 'categories' as const, label: 'Catégories', icon: FolderTree },
    { id: 'colors' as const, label: 'Couleurs', icon: Palette },
    { id: 'fragrances' as const, label: 'Parfums', icon: SprayCan },
    { id: 'accounts' as const, label: 'Comptes', icon: Users },
    { id: 'shop' as const, label: 'Boutique', icon: ShoppingCart },
  ]
  return <div className="settings-shell"><nav className="settings-tabs" aria-label="Réglages du catalogue">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon />{label}</button>)}</nav>{tab === 'categories' && <CategorySettings />}{tab === 'colors' && <ColorSettings />}{tab === 'fragrances' && <FragranceSettings />}{tab === 'accounts' && <AccountSettings />}{tab === 'shop' && <ShopSettings />}</div>
}

function CategorySettings() {
  const [items, setItems] = useState<CatalogCategory[]>([])
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('catalog_categories').select('*').order('sort_order'); setItems((data ?? []) as CatalogCategory[]) }
  useEffect(() => {
    void supabase!.from('catalog_categories').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as CatalogCategory[]))
  }, [])
  const roots = items.filter((item) => !item.parent_id)
  const add = async (event: FormEvent) => {
    event.preventDefault(); setNotice('')
    const { error } = await supabase!.from('catalog_categories').insert({ name: name.trim(), slug: slugify(name), parent_id: parentId || null, sort_order: items.length })
    if (error) setNotice(error.code === '23505' ? 'Cette catégorie existe déjà.' : 'La catégorie n’a pas pu être ajoutée.')
    else { setName(''); setParentId(''); setNotice('Catégorie ajoutée.'); await load() }
  }
  const toggle = async (item: CatalogCategory) => { await supabase!.from('catalog_categories').update({ active: !item.active }).eq('id', item.id); await load() }
  const ordered = useMemo(() => roots.flatMap((root) => [root, ...items.filter((item) => item.parent_id === root.id)]), [items, roots])
  return <SettingsPanel title="Catégories et sous-catégories" description="Créez les grandes familles du catalogue, puis leurs sous-catégories."><form className="settings-add-form" onSubmit={add}><label>Nom<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Bougies moulées" required minLength={2} /></label><label>Catégorie parente<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Aucune — catégorie principale</option>{roots.map((root) => <option key={root.id} value={root.id}>{root.name}</option>)}</select></label><button className="button button--dark"><Plus /> Ajouter</button></form>{notice && <p className="settings-notice">{notice}</p>}<div className="settings-list">{ordered.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><FolderTree /><div><strong>{item.parent_id ? `↳ ${item.name}` : item.name}</strong><small>{item.parent_id ? `Sous-catégorie de ${roots.find((root) => root.id === item.parent_id)?.name ?? ''}` : 'Catégorie principale'}</small></div><button onClick={() => void toggle(item)}>{item.active ? 'Désactiver' : 'Réactiver'}</button></article>)}</div></SettingsPanel>
}

function ColorSettings() {
  const [items, setItems] = useState<CatalogColor[]>([])
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#E8DFD2')
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('catalog_colors').select('*').order('sort_order'); setItems((data ?? []) as CatalogColor[]) }
  useEffect(() => {
    void supabase!.from('catalog_colors').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as CatalogColor[]))
  }, [])
  const add = async (event: FormEvent) => { event.preventDefault(); const { error } = await supabase!.from('catalog_colors').insert({ name: name.trim(), hex_code: hex.toUpperCase(), sort_order: items.length }); if (error) setNotice(error.code === '23505' ? 'Cette couleur existe déjà.' : 'La couleur n’a pas pu être ajoutée.'); else { setName(''); setNotice('Couleur ajoutée.'); await load() } }
  const toggle = async (item: CatalogColor) => { await supabase!.from('catalog_colors').update({ active: !item.active }).eq('id', item.id); await load() }
  return <SettingsPanel title="Nuancier" description="Ces couleurs pourront être sélectionnées indépendamment sur chaque produit."><form className="settings-add-form settings-add-form--color" onSubmit={add}><label>Nom<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rose poudré" required minLength={2} /></label><label>Couleur<input type="color" value={hex} onChange={(event) => setHex(event.target.value)} /></label><button className="button button--dark"><Plus /> Ajouter</button></form>{notice && <p className="settings-notice">{notice}</p>}<div className="settings-list settings-list--colors">{items.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><span className="color-chip" style={{ backgroundColor: item.hex_code }} /><div><strong>{item.name}</strong><small>{item.hex_code}</small></div><button onClick={() => void toggle(item)}>{item.active ? 'Désactiver' : 'Réactiver'}</button></article>)}</div></SettingsPanel>
}

function FragranceSettings() {
  const [items, setItems] = useState<CatalogFragrance[]>([])
  const [name, setName] = useState('')
  const [composition, setComposition] = useState('')
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('catalog_fragrances').select('*').order('sort_order'); setItems((data ?? []) as CatalogFragrance[]) }
  useEffect(() => {
    void supabase!.from('catalog_fragrances').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as CatalogFragrance[]))
  }, [])
  const add = async (event: FormEvent) => { event.preventDefault(); const { error } = await supabase!.from('catalog_fragrances').insert({ name: name.trim(), slug: slugify(name), composition: composition.trim(), sort_order: items.length }); if (error) setNotice(error.code === '23505' ? 'Ce parfum existe déjà.' : 'Le parfum n’a pas pu être ajouté.'); else { setName(''); setComposition(''); setNotice('Parfum ajouté.'); await load() } }
  const toggle = async (item: CatalogFragrance) => { await supabase!.from('catalog_fragrances').update({ active: !item.active }).eq('id', item.id); await load() }
  return <SettingsPanel title="Parfums et compositions" description="Enregistrez chaque composition une fois, puis sélectionnez simplement le parfum dans un produit."><form className="settings-add-form settings-add-form--fragrance" onSubmit={add}><label>Nom du parfum<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fleur de coton" required minLength={2} /></label><label>Composition<textarea value={composition} onChange={(event) => setComposition(event.target.value)} placeholder="Cire végétale, fragrance…" required rows={3} /></label><button className="button button--dark"><Plus /> Ajouter</button></form>{notice && <p className="settings-notice">{notice}</p>}<div className="settings-list settings-list--fragrances">{items.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><SprayCan /><div><strong>{item.name}</strong><small>{item.composition}</small></div><button onClick={() => void toggle(item)}>{item.active ? 'Désactiver' : 'Réactiver'}</button></article>)}</div></SettingsPanel>
}

function AccountSettings() {
  const [items, setItems] = useState<StaffAccount[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('exploitant')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('admins').select('user_id,email,role,active,created_at').order('created_at'); setItems((data ?? []) as StaffAccount[]) }
  useEffect(() => {
    void supabase!.from('admins').select('user_id,email,role,active,created_at').order('created_at').then(({ data }) => setItems((data ?? []) as StaffAccount[]))
  }, [])
  const invite = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setNotice(''); const { error } = await supabase!.functions.invoke('invite-staff', { body: { email, role } }); if (error) setNotice(error.message || 'L’invitation n’a pas pu être envoyée.'); else { setEmail(''); setNotice('Invitation envoyée. Le compte apparaîtra dès maintenant dans la liste.'); await load() } setSaving(false) }
  return <SettingsPanel title="Comptes de l’équipe" description="Invitez une personne et choisissez précisément son niveau d’accès."><form className="settings-add-form" onSubmit={invite}><label>Adresse e-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Rôle<select value={role} onChange={(event) => setRole(event.target.value as StaffRole)}><option value="exploitant">Exploitant — contenu du site</option><option value="admin">Administrateur — tous les réglages</option></select></label><button className="button button--dark" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <UserPlus />} Inviter</button></form>{notice && <p className="settings-notice">{notice}</p>}<div className="settings-list">{items.map((item) => <article key={item.user_id} className={!item.active ? 'inactive' : ''}><Users /><div><strong>{item.email ?? 'Adresse indisponible'}</strong><small>{item.role === 'admin' ? 'Administrateur' : 'Exploitant'} · {item.active ? 'Accès actif' : 'Accès désactivé'}</small></div></article>)}</div></SettingsPanel>
}

function ShopSettings() {
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => { supabase!.from('site_settings').select('boolean_value').eq('id', 'cart_enabled').single().then(({ data }) => setEnabled(Boolean(data?.boolean_value))) }, [])
  const update = async (value: boolean) => { setSaving(true); const { error } = await supabase!.from('site_settings').upsert({ id: 'cart_enabled', boolean_value: value }); if (!error) setEnabled(value); setSaving(false) }
  return <SettingsPanel title="Boutique en ligne" description="Préparez les fonctions commerciales sans les rendre visibles trop tôt."><section className="admin-shop-setting"><ShoppingCart /><div><h2>Panier du site</h2><p>Laissez-le désactivé tant que la vente en ligne n’est pas ouverte.</p></div><label className="admin-switch"><input type="checkbox" checked={enabled} disabled={saving} onChange={(event) => void update(event.target.checked)} /><span /><strong>{saving ? 'Enregistrement…' : enabled ? 'Panier activé' : 'Panier désactivé'}</strong></label></section></SettingsPanel>
}

function SettingsPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="settings-panel"><header><h2>{title}</h2><p>{description}</p></header>{children}</section>
}
