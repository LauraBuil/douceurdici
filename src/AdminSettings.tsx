import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { FolderTree, LoaderCircle, Palette, Pencil, Plus, Save, ShoppingCart, SprayCan, Trash2, UserPlus, Users, X } from 'lucide-react'
import type { CatalogCategory, CatalogColor, CatalogFragrance, StaffAccount, StaffRole } from './data'
import { supabase } from './lib/supabase'

type SettingsTab = 'categories' | 'colors' | 'fragrances' | 'accounts' | 'shop'
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const linkedItemMessage = 'Cet élément est encore utilisé. Retirez-le d’abord des produits ou des sous-catégories concernés.'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('catalog_categories').select('*').order('sort_order'); setItems((data ?? []) as CatalogCategory[]) }
  useEffect(() => { void supabase!.from('catalog_categories').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as CatalogCategory[])) }, [])
  const roots = items.filter((item) => !item.parent_id)
  const reset = () => { setEditingId(null); setName(''); setParentId('') }
  const edit = (item: CatalogCategory) => { setEditingId(item.id); setName(item.name); setParentId(item.parent_id ?? ''); setNotice('') }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setNotice('')
    const values = { name: name.trim(), parent_id: parentId || null }
    const query = editingId
      ? supabase!.from('catalog_categories').update(values).eq('id', editingId)
      : supabase!.from('catalog_categories').insert({ ...values, slug: slugify(name), sort_order: items.length })
    const { error } = await query
    if (error) setNotice(error.code === '23505' ? 'Cette catégorie existe déjà.' : 'La catégorie n’a pas pu être enregistrée.')
    else { setNotice(editingId ? 'Catégorie modifiée.' : 'Catégorie ajoutée.'); reset(); await load() }
  }
  const toggle = async (item: CatalogCategory) => { await supabase!.from('catalog_categories').update({ active: !item.active }).eq('id', item.id); await load() }
  const remove = async (item: CatalogCategory) => {
    if (!window.confirm(`Supprimer définitivement la catégorie « ${item.name} » ?`)) return
    const { error } = await supabase!.from('catalog_categories').delete().eq('id', item.id)
    if (error) setNotice(error.code === '23503' ? linkedItemMessage : 'La catégorie n’a pas pu être supprimée.')
    else { if (editingId === item.id) reset(); setNotice('Catégorie supprimée.'); await load() }
  }
  return <SettingsPanel title="Catégories et sous-catégories" description="Créez les grandes familles du catalogue, puis leurs sous-catégories."><form className="settings-add-form" onSubmit={save}><label>Nom<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Bougies moulées" required minLength={2} /></label><label>Catégorie parente<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Aucune — catégorie principale</option>{roots.filter((root) => root.id !== editingId).map((root) => <option key={root.id} value={root.id}>{root.name}</option>)}</select></label><button className="button button--dark">{editingId ? <Save /> : <Plus />} {editingId ? 'Enregistrer' : 'Ajouter'}</button>{editingId && <button type="button" className="settings-cancel" onClick={reset}><X /> Annuler</button>}</form>{notice && <p className="settings-notice">{notice}</p>}<div className="category-groups">{roots.map((root) => { const children = items.filter((item) => item.parent_id === root.id); return <section key={root.id} className={`category-group ${!root.active ? 'inactive' : ''}`}><div className="category-group-root"><FolderTree /><div><strong>{root.name}</strong><small>Catégorie principale · {children.length} sous-catégorie{children.length > 1 ? 's' : ''}</small></div><SettingsActions active={root.active} onEdit={() => edit(root)} onToggle={() => void toggle(root)} onRemove={() => void remove(root)} /></div>{children.length > 0 ? <div className="category-group-children">{children.map((child) => <article key={child.id} className={!child.active ? 'inactive' : ''}><span className="category-branch" aria-hidden="true" /><div><strong>{child.name}</strong><small>Sous-catégorie</small></div><SettingsActions active={child.active} onEdit={() => edit(child)} onToggle={() => void toggle(child)} onRemove={() => void remove(child)} /></article>)}</div> : <p className="category-group-empty">Aucune sous-catégorie pour le moment.</p>}</section> })}</div></SettingsPanel>
}

function ColorSettings() {
  const [items, setItems] = useState<CatalogColor[]>([])
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#E8DFD2')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('catalog_colors').select('*').order('sort_order'); setItems((data ?? []) as CatalogColor[]) }
  useEffect(() => { void supabase!.from('catalog_colors').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as CatalogColor[])) }, [])
  const reset = () => { setEditingId(null); setName(''); setHex('#E8DFD2') }
  const edit = (item: CatalogColor) => { setEditingId(item.id); setName(item.name); setHex(item.hex_code); setNotice('') }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setNotice('')
    const values = { name: name.trim(), hex_code: hex.toUpperCase() }
    const query = editingId ? supabase!.from('catalog_colors').update(values).eq('id', editingId) : supabase!.from('catalog_colors').insert({ ...values, sort_order: items.length })
    const { error } = await query
    if (error) setNotice(error.code === '23505' ? 'Cette couleur existe déjà.' : 'La couleur n’a pas pu être enregistrée.')
    else { setNotice(editingId ? 'Couleur modifiée.' : 'Couleur ajoutée.'); reset(); await load() }
  }
  const toggle = async (item: CatalogColor) => { await supabase!.from('catalog_colors').update({ active: !item.active }).eq('id', item.id); await load() }
  const remove = async (item: CatalogColor) => {
    if (!window.confirm(`Supprimer définitivement la couleur « ${item.name} » ?`)) return
    const { error } = await supabase!.from('catalog_colors').delete().eq('id', item.id)
    if (error) setNotice(error.code === '23503' ? linkedItemMessage : 'La couleur n’a pas pu être supprimée.')
    else { if (editingId === item.id) reset(); setNotice('Couleur supprimée.'); await load() }
  }
  return <SettingsPanel title="Nuancier" description="Ces couleurs pourront être sélectionnées indépendamment sur chaque produit."><form className="settings-add-form settings-add-form--color" onSubmit={save}><label>Nom<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rose poudré" required minLength={2} /></label><label>Couleur<input type="color" value={hex} onChange={(event) => setHex(event.target.value)} /></label><button className="button button--dark">{editingId ? <Save /> : <Plus />} {editingId ? 'Enregistrer' : 'Ajouter'}</button>{editingId && <button type="button" className="settings-cancel" onClick={reset}><X /> Annuler</button>}</form>{notice && <p className="settings-notice">{notice}</p>}<div className="settings-list settings-list--colors">{items.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><span className="color-chip" style={{ backgroundColor: item.hex_code }} /><div><strong>{item.name}</strong><small>{item.hex_code}</small></div><SettingsActions active={item.active} onEdit={() => edit(item)} onToggle={() => void toggle(item)} onRemove={() => void remove(item)} /></article>)}</div></SettingsPanel>
}

function FragranceSettings() {
  const [items, setItems] = useState<CatalogFragrance[]>([])
  const [name, setName] = useState('')
  const [composition, setComposition] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('catalog_fragrances').select('*').order('sort_order'); setItems((data ?? []) as CatalogFragrance[]) }
  useEffect(() => { void supabase!.from('catalog_fragrances').select('*').order('sort_order').then(({ data }) => setItems((data ?? []) as CatalogFragrance[])) }, [])
  const reset = () => { setEditingId(null); setName(''); setComposition('') }
  const edit = (item: CatalogFragrance) => { setEditingId(item.id); setName(item.name); setComposition(item.composition); setNotice('') }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setNotice('')
    const values = { name: name.trim(), composition: composition.trim() }
    const query = editingId ? supabase!.from('catalog_fragrances').update(values).eq('id', editingId) : supabase!.from('catalog_fragrances').insert({ ...values, slug: slugify(name), sort_order: items.length })
    const { error } = await query
    if (error) setNotice(error.code === '23505' ? 'Ce parfum existe déjà.' : 'Le parfum n’a pas pu être enregistré.')
    else { setNotice(editingId ? 'Parfum et composition modifiés.' : 'Parfum ajouté.'); reset(); await load() }
  }
  const toggle = async (item: CatalogFragrance) => { await supabase!.from('catalog_fragrances').update({ active: !item.active }).eq('id', item.id); await load() }
  const remove = async (item: CatalogFragrance) => {
    if (!window.confirm(`Supprimer définitivement le parfum « ${item.name} » et sa composition ?`)) return
    const { error } = await supabase!.from('catalog_fragrances').delete().eq('id', item.id)
    if (error) setNotice(error.code === '23503' ? linkedItemMessage : 'Le parfum n’a pas pu être supprimé.')
    else { if (editingId === item.id) reset(); setNotice('Parfum supprimé.'); await load() }
  }
  return <SettingsPanel title="Parfums et compositions" description="Enregistrez chaque composition une fois, puis sélectionnez simplement le parfum dans un produit."><form className="settings-add-form settings-add-form--fragrance" onSubmit={save}><label>Nom du parfum<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fleur de coton" required minLength={2} /></label><label>Composition<textarea value={composition} onChange={(event) => setComposition(event.target.value)} placeholder="Cire végétale, fragrance…" required rows={3} /></label><button className="button button--dark">{editingId ? <Save /> : <Plus />} {editingId ? 'Enregistrer' : 'Ajouter'}</button>{editingId && <button type="button" className="settings-cancel" onClick={reset}><X /> Annuler</button>}</form>{notice && <p className="settings-notice">{notice}</p>}<div className="settings-list settings-list--fragrances">{items.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><SprayCan /><div><strong>{item.name}</strong><small>{item.composition}</small></div><SettingsActions active={item.active} onEdit={() => edit(item)} onToggle={() => void toggle(item)} onRemove={() => void remove(item)} /></article>)}</div></SettingsPanel>
}

function SettingsActions({ active, onEdit, onToggle, onRemove }: { active: boolean; onEdit: () => void; onToggle: () => void; onRemove: () => void }) {
  return <div className="settings-actions"><button type="button" onClick={onEdit}><Pencil /> Modifier</button><button type="button" onClick={onToggle}>{active ? 'Désactiver' : 'Réactiver'}</button><button type="button" className="danger" onClick={onRemove}><Trash2 /> Supprimer</button></div>
}

function AccountSettings() {
  const [items, setItems] = useState<StaffAccount[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('exploitant')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const load = async () => { const { data } = await supabase!.from('admins').select('user_id,email,role,active,created_at').order('created_at'); setItems((data ?? []) as StaffAccount[]) }
  useEffect(() => { void supabase!.from('admins').select('user_id,email,role,active,created_at').order('created_at').then(({ data }) => setItems((data ?? []) as StaffAccount[])) }, [])
  const invite = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setNotice(''); const { error } = await supabase!.functions.invoke('invite-staff', { body: { email, role } }); if (error) setNotice(error.message || 'L’invitation n’a pas pu être envoyée.'); else { setEmail(''); setNotice('Invitation envoyée. Le compte apparaît maintenant dans la liste.'); await load() } setSaving(false) }
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
