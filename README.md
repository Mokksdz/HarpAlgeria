# 🎀 Harp E-commerce

**Prêt-à-porter féminin élégant et modeste - Algérie**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://prisma.io/)

## 🚀 Quick Start

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Générer les secrets
node scripts/generate-secrets.js

# 4. Initialiser la base de données
npx prisma migrate dev

# 5. Lancer le serveur
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📁 Structure

```
src/
├── app/              # Pages et routes API (Next.js App Router)
├── components/       # Composants React réutilisables
├── lib/              # Services, utilitaires, configurations
│   ├── accounting/   # Services comptabilité
│   ├── loyalty/      # Système fidélité
│   └── validations/  # Schemas Zod
└── types/            # Types TypeScript
```

## 🔧 Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur développement |
| `npm run build` | Build production |
| `npm test` | Lancer les tests |
| `npm run lint` | Vérifier le code |

## 📚 Documentation

- [Checklist Production](docs/PRODUCTION_CHECKLIST.md)
- [Migration PostgreSQL](docs/POSTGRESQL_MIGRATION.md)
- [Audit Sécurité](AUDIT_COMPLET_DEC_2025.md)
- [API OpenAPI](docs/openapi.yaml)

## 🔐 Sécurité

- ✅ Rate limiting sur les APIs
- ✅ Headers de sécurité (CSP, XSS, etc.)
- ✅ Authentification NextAuth + bcrypt
- ✅ Validation Zod sur toutes les entrées

## 🛒 Fonctionnalités

- **E-commerce** : Panier, checkout, confirmation
- **Livraison** : Intégration Yalidine & ZR Express
- **Fidélité** : Points, niveaux VIP, anniversaires
- **Admin** : Dashboard, produits, commandes, comptabilité
- **i18n** : Français / Arabe

## 📦 Technologies

- **Framework** : Next.js 16 (App Router)
- **UI** : React 19, TailwindCSS 4
- **Base de données** : Prisma + SQLite (dev) / PostgreSQL (prod)
- **Auth** : NextAuth.js
- **Validation** : Zod
- **Icons** : Lucide React

## 🚢 Déploiement

```bash
# Vercel (recommandé)
vercel --prod

# Docker
docker build -t harp .
docker run -p 3000:3000 harp
```

Voir [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) pour plus de détails.

---

**Harp** - Une élégance qui résonne 🎀
