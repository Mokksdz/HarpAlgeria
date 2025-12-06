# Migration vers PostgreSQL

## Pourquoi migrer ?

SQLite est parfait pour le développement, mais en production il est recommandé d'utiliser PostgreSQL pour :
- Meilleure performance avec plusieurs utilisateurs
- Backups automatiques
- Haute disponibilité
- Scaling horizontal

## Options gratuites

### 1. Supabase (Recommandé)
- **Gratuit** : 500MB de stockage, 2 projets
- URL : https://supabase.com
- Facile à configurer

### 2. Neon
- **Gratuit** : 512MB de stockage
- URL : https://neon.tech
- Serverless PostgreSQL

### 3. Railway
- **Gratuit** : $5 de crédit par mois
- URL : https://railway.app

## Étapes de migration

### 1. Créer un compte sur Supabase/Neon

### 2. Récupérer la connection string
```
postgresql://user:password@host:port/database
```

### 3. Modifier le fichier `.env`
```env
# Remplacer :
DATABASE_URL="file:./dev.db"

# Par :
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### 4. Modifier `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"  // Changer de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

### 5. Appliquer les migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Migrer les données (optionnel)
Si vous avez des données dans SQLite à migrer :

```bash
# Exporter depuis SQLite
npx prisma db execute --file=export.sql

# Ou utiliser un outil comme pgloader
```

## Variables d'environnement pour production

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="votre-secret-securise-generer-avec-openssl-rand-base64-32"
NEXTAUTH_URL="https://votre-domaine.com"
```

## Checklist avant déploiement

- [ ] PostgreSQL configuré
- [ ] NEXTAUTH_SECRET généré (32+ caractères)
- [ ] NEXTAUTH_URL configuré
- [ ] Migrations appliquées
- [ ] Données testées
