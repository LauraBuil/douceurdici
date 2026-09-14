export type Category = string
export type StaffRole = 'admin' | 'exploitant'

export type CatalogCategory = { id: string; name: string; slug: string; parent_id: string | null; active: boolean; sort_order: number }
export type CatalogColor = { id: string; name: string; hex_code: string; active: boolean; sort_order: number }
export type CatalogFragrance = { id: string; name: string; slug: string; composition: string; active: boolean; sort_order: number }
export type ProductImage = { id: string; product_id?: string; color_id: string | null; image_url: string; alt_text: string; is_primary: boolean; sort_order: number }
export type ProductColorLink = { color_id: string; color: CatalogColor | null }
export type ProductFragranceLink = { fragrance_id: string; fragrance: CatalogFragrance | null }
export type StaffAccount = { user_id: string; email: string | null; role: StaffRole; active: boolean; created_at: string }

export type Product = {
  id: string
  name: string
  slug: string
  category: Category
  category_id: string | null
  category_record?: CatalogCategory | null
  short_description: string
  description: string
  price: number
  price_visible: boolean
  color: string
  scent: string
  composition: string
  weight: string | null
  image_url: string
  product_colors?: ProductColorLink[]
  product_fragrances?: ProductFragranceLink[]
  product_images?: ProductImage[]
  featured: boolean
  published: boolean
  sort_order: number
}

const demoCategories: Record<string, CatalogCategory> = {
  bougie: { id: 'cat-bougie', name: 'Bougies', slug: 'bougie', parent_id: null, active: true, sort_order: 1 },
  savon: { id: 'cat-savon', name: 'Savons', slug: 'savon', parent_id: null, active: true, sort_order: 2 },
  coffret: { id: 'cat-coffret', name: 'Coffrets', slug: 'coffret', parent_id: null, active: true, sort_order: 3 },
}
const ivory: CatalogColor = { id: 'color-ivory', name: 'Ivoire', hex_code: '#EEE8DD', active: true, sort_order: 1 }
const blush: CatalogColor = { id: 'color-blush', name: 'Rose poudré', hex_code: '#DDBEB6', active: true, sort_order: 2 }
const cotton: CatalogFragrance = { id: 'fragrance-cotton', name: 'Fleur de coton', slug: 'fleur-de-coton', composition: 'Fragrance fleur de coton et cire végétale.', active: true, sort_order: 1 }
const lavender: CatalogFragrance = { id: 'fragrance-lavender', name: 'Lavande', slug: 'lavande', composition: 'Parfum de lavande et huiles végétales saponifiées.', active: true, sort_order: 2 }

export const demoProducts: Product[] = [
  { id: 'demo-1', name: 'Bougie Bébé douceur', slug: 'bougie-bebe-douceur', category: 'bougie', category_id: demoCategories.bougie.id, category_record: demoCategories.bougie, short_description: 'Cire végétale · Coulée à la main', description: 'Une bougie sculptée tendre et délicate, préparée artisanalement dans les Pyrénées.', price: 18, price_visible: true, color: '', scent: '', composition: '', weight: '150 g', image_url: '/assets/bougie-bebe.jpg', product_colors: [{ color_id: ivory.id, color: ivory }, { color_id: blush.id, color: blush }], product_fragrances: [{ fragrance_id: cotton.id, fragrance: cotton }], product_images: [{ id: 'image-1', image_url: '/assets/bougie-bebe.jpg', alt_text: 'Bougie Bébé douceur', color_id: ivory.id, is_primary: true, sort_order: 0 }], featured: true, published: true, sort_order: 1 },
  { id: 'demo-2', name: 'Savon Lavande douce', slug: 'savon-lavande-douce', category: 'savon', category_id: demoCategories.savon.id, category_record: demoCategories.savon, short_description: 'Saponifié à froid · Peaux délicates', description: 'Un savon doux aux notes de lavande, fabriqué en petite série avec des ingrédients choisis.', price: 8.5, price_visible: true, color: '', scent: '', composition: '', weight: '100 g', image_url: '/assets/savon-lavande.png', product_colors: [{ color_id: ivory.id, color: ivory }], product_fragrances: [{ fragrance_id: lavender.id, fragrance: lavender }], product_images: [{ id: 'image-2', image_url: '/assets/savon-lavande.png', alt_text: 'Savon Lavande douce', color_id: ivory.id, is_primary: true, sort_order: 0 }], featured: true, published: true, sort_order: 2 },
  { id: 'demo-3', name: 'Bougie Rêve poudré', slug: 'bougie-reve-poudre', category: 'bougie', category_id: demoCategories.bougie.id, category_record: demoCategories.bougie, short_description: 'Création artisanale aux tons doux', description: 'Une création décorative aux couleurs douces, imaginée pour les cadeaux de naissance.', price: 22, price_visible: true, color: '', scent: '', composition: '', weight: '180 g', image_url: '/assets/creations-douceur-dici.jpg', product_colors: [{ color_id: blush.id, color: blush }, { color_id: ivory.id, color: ivory }], product_fragrances: [{ fragrance_id: cotton.id, fragrance: cotton }], product_images: [{ id: 'image-3', image_url: '/assets/creations-douceur-dici.jpg', alt_text: 'Bougie Rêve poudré', color_id: blush.id, is_primary: true, sort_order: 0 }], featured: true, published: true, sort_order: 3 },
  { id: 'demo-4', name: 'Coffret Petits bonheurs', slug: 'coffret-petits-bonheurs', category: 'coffret', category_id: demoCategories.coffret.id, category_record: demoCategories.coffret, short_description: 'Bougie & savon · Prêt à offrir', description: 'Une attention artisanale composée à l’atelier et présentée dans un écrin kraft.', price: 32, price_visible: false, color: '', scent: '', composition: '', weight: null, image_url: '/assets/creations-douceur-dici.jpg', product_colors: [], product_fragrances: [], product_images: [{ id: 'image-4', image_url: '/assets/creations-douceur-dici.jpg', alt_text: 'Coffret Petits bonheurs', color_id: null, is_primary: true, sort_order: 0 }], featured: false, published: true, sort_order: 4 },
]

export type GalleryImage = { id: string; image_url: string; alt_text: string; caption: string; published: boolean; sort_order: number }
export type Market = { id: string; name: string; location: string; start_date: string; end_date: string | null; details: string; published: boolean }

export const legacyCategoryLabels: Record<string, string> = { bougie: 'Bougies', savon: 'Savons', diffuseur: 'Diffuseurs', coffret: 'Coffrets' }
export const productCategoryLabel = (product: Product) => product.category_record?.name ?? legacyCategoryLabels[product.category] ?? product.category
export const productPrimaryImage = (product: Product) => [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]?.image_url || product.image_url || '/assets/creations-douceur-dici.jpg'
export const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
