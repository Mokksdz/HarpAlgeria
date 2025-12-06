# Configuration des Variables d'Environnement

## Variables Requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Base de données (SQLite pour dev, PostgreSQL pour prod)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth - Authentification Admin
NEXTAUTH_SECRET="votre-secret-securise-minimum-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"

# Analytics (optionnel)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FB_PIXEL_ID="XXXXXXXXXXXXXXX"
```

## Description des Variables

### Base de données
- `DATABASE_URL` : URL de connexion à la base de données
  - SQLite (dev) : `file:./prisma/dev.db`
  - PostgreSQL (prod) : `postgresql://user:pass@host:port/db?sslmode=require`

### Authentification
- `NEXTAUTH_SECRET` : Clé secrète pour signer les tokens JWT
  - Générer avec : `openssl rand -base64 32`
- `NEXTAUTH_URL` : URL de base de l'application

### Analytics
- `NEXT_PUBLIC_GA_ID` : ID Google Analytics (format: G-XXXXXXXXXX)
- `NEXT_PUBLIC_FB_PIXEL_ID` : ID Facebook Pixel

## Identifiants Admin par Défaut

- **Email** : `admin@harp.dz`
- **Mot de passe** : `harp2025`

⚠️ **Important** : Changez ces identifiants en production dans `src/lib/auth.ts`

## Configuration Production

Pour la production, assurez-vous de :
1. Utiliser PostgreSQL au lieu de SQLite
2. Générer un nouveau `NEXTAUTH_SECRET`
3. Configurer `NEXTAUTH_URL` avec le domaine réel
4. Ajouter les IDs analytics
