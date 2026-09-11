export type Category = 'bougie' | 'savon' | 'diffuseur' | 'coffret'

export type Product = {
  id: string
  name: string
  slug: string
  category: Category
  short_description: string
  description: string
  price: number
  weight: string | null
  image_url: string
  featured: boolean
  published: boolean
  sort_order: number
}

export const demoProducts: Product[] = [
  { id: 'demo-1', name: 'Bougie Bébé douceur', slug: 'bougie-bebe-douceur', category: 'bougie', short_description: 'Cire végétale · Coulée à la main', description: 'Une bougie sculptée tendre et délicate, préparée artisanalement dans les Pyrénées.', price: 18, weight: '150 g', image_url: '/assets/bougie-bebe.jpg', featured: true, published: true, sort_order: 1 },
  { id: 'demo-2', name: 'Savon Lavande douce', slug: 'savon-lavande-douce', category: 'savon', short_description: 'Saponifié à froid · Peaux délicates', description: 'Un savon doux aux notes de lavande, fabriqué en petite série avec des ingrédients choisis.', price: 8.5, weight: '100 g', image_url: '/assets/savon-lavande.png', featured: true, published: true, sort_order: 2 },
  { id: 'demo-3', name: 'Bougie Rêve poudré', slug: 'bougie-reve-poudre', category: 'bougie', short_description: 'Parfum coton · Création artisanale', description: 'Une création décorative aux couleurs douces, imaginée pour les cadeaux de naissance.', price: 22, weight: '180 g', image_url: '/assets/creations-douceur-dici.jpg', featured: true, published: true, sort_order: 3 },
  { id: 'demo-4', name: 'Coffret Petits bonheurs', slug: 'coffret-petits-bonheurs', category: 'coffret', short_description: 'Bougie & savon · Prêt à offrir', description: 'Une attention artisanale composée à l’atelier et présentée dans un écrin kraft.', price: 32, weight: null, image_url: '/assets/creations-douceur-dici.jpg', featured: false, published: true, sort_order: 4 },
]

export const categoryLabels: Record<Category, string> = { bougie: 'Bougies', savon: 'Savons', diffuseur: 'Diffuseurs', coffret: 'Coffrets' }
export const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
