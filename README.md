# Douceur d’ici

Site vitrine et catalogue administrable de **Douceur d’ici**, artisan de bougies et savons dans les Pyrénées.

## Stack

- React 19 + TypeScript + Vite
- CSS responsive sur mesure
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Hébergement statique compatible Hostinger / Apache

## Développement local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables attendues :

```dotenv
VITE_SUPABASE_URL=https://tgvawgneniadximqmdmg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La clé publishable est conçue pour être exposée côté navigateur. Toutes les données restent protégées par les règles RLS de Supabase. Ne jamais utiliser de clé `secret` ou `service_role` dans le site.

## Base Supabase

Les migrations versionnées se trouvent dans `supabase/migrations`. Elles créent :

- le catalogue `products` ;
- la liste sécurisée `admins` ;
- le bucket public `product-images` ;
- les règles RLS de lecture publique et de gestion réservée aux administrateurs.

Les migrations initiales ont été appliquées au projet `tgvawgneniadximqmdmg`.

### Créer le premier administrateur

1. Dans Supabase, ouvrir **Authentication → Users** et créer l’utilisateur avec son adresse e-mail.
2. Dans l’éditeur SQL, autoriser cet utilisateur :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'adresse@exemple.fr'
on conflict (user_id) do nothing;
```

L’utilisateur peut ensuite se connecter sur `/admin` et ajouter, modifier, publier ou supprimer les produits.

## Production Hostinger

```bash
npm run build
```

Déployer le contenu du dossier `dist/` dans `public_html/`, puis renseigner les deux variables `VITE_SUPABASE_*` avant la construction. Le fichier `.htaccess` inclus redirige les routes `/catalogue` et `/admin` vers l’application React.

Le domaine prévu est [douceurdici.com](https://douceurdici.com).
