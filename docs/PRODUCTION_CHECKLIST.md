# 🚀 Checklist Déploiement Production - Harp E-commerce

**Dernière mise à jour**: 6 Décembre 2025  
**Statut**: ✅ READY FOR PRODUCTION

---

## CI/CD Pipeline Commands

```bash
# Validation complète avant déploiement
npm ci
npx tsc --noEmit
npx eslint "./src/**/*.{ts,tsx}" --fix
npm test -- --passWithNoTests
npm run build
npm audit --production --audit-level=moderate
```

## Healthcheck Endpoints

```bash
# Vérifier le statut de l'application
curl https://your-domain.com/api/health  # À créer si nécessaire

# Vérifier la connectivité DB
curl https://your-domain.com/api/products?limit=1
```

## SLO (Service Level Objectives)

| Métrique | Objectif |
|----------|----------|
| Disponibilité | 99.5% |
| Temps de réponse API | < 500ms |
| Temps de chargement page | < 3s |
| Score Lighthouse Performance | > 90 |

---

## Avant le déploiement

### 1. Variables d'environnement (OBLIGATOIRES)

```env
# Base de données
DATABASE_URL="postgresql://user:pass@host:5432/harp?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="générer-avec-openssl-rand-base64-32"
NEXTAUTH_URL="https://votre-domaine.com"

# Admin
ADMIN_EMAIL="admin@votredomaine.com"
ADMIN_PASSWORD_HASH="hash-bcrypt-généré"

# Livraison
YALIDINE_API_ID="votre-id"
YALIDINE_API_TOKEN="votre-token"
ZR_EXPRESS_TOKEN="votre-token"
ZR_EXPRESS_KEY="votre-key"

# Upload images (optionnel)
CLOUDINARY_CLOUD_NAME="votre-cloud"
CLOUDINARY_API_KEY="votre-key"
CLOUDINARY_API_SECRET="votre-secret"

# Email (optionnel)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="email@example.com"
SMTP_PASS="password"
```

### 2. Générer le hash admin

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('VOTRE_MOT_DE_PASSE', 10));"
```

### 3. Base de données

- [ ] PostgreSQL configuré (Supabase, Neon, ou autre)
- [ ] Migrations appliquées: `npx prisma migrate deploy`
- [ ] Client Prisma généré: `npx prisma generate`

### 4. Build et vérifications

```bash
# Vérifier TypeScript
npx tsc --noEmit

# Build production
npm run build

# Tests
npm test
```

---

## Checklist de sécurité

- [ ] `ADMIN_PASSWORD_HASH` défini (pas de mot de passe par défaut)
- [ ] `NEXTAUTH_SECRET` généré aléatoirement (32+ caractères)
- [ ] Headers de sécurité activés (X-Frame-Options, etc.)
- [ ] CORS restreint aux domaines autorisés
- [ ] Rate limiting actif sur les routes sensibles
- [ ] HTTPS obligatoire en production

---

## Checklist fonctionnelle

### E-commerce
- [ ] Produits visibles sur /shop
- [ ] Ajout au panier fonctionne
- [ ] Checkout complet jusqu'à confirmation
- [ ] Tracking commande fonctionne

### Admin
- [ ] Login admin fonctionne
- [ ] Dashboard affiche les statistiques
- [ ] Création/modification produits
- [ ] Gestion commandes
- [ ] Création expéditions (Yalidine/ZR Express)

### Livraison
- [ ] API Yalidine répond
- [ ] API ZR Express répond
- [ ] Calcul des frais correct
- [ ] Sync tracking fonctionne

### Comptabilité
- [ ] Fournisseurs créables
- [ ] Achats enregistrables
- [ ] Stock mis à jour
- [ ] Rapports générés

---

## Déploiement recommandé

### Option 1: Vercel (Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Option 2: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

### Option 3: VPS (O2Switch, etc.)
```bash
# Sur le serveur
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart harp
```

---

## Monitoring post-déploiement

### Vérifier
- [ ] Site accessible sur le domaine
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Images chargent correctement
- [ ] Formulaires fonctionnent
- [ ] Paiement/livraison ok

### Logs à surveiller
```bash
# Vercel
vercel logs --follow

# PM2
pm2 logs harp

# Docker
docker logs -f harp-container
```

---

## Rollback d'urgence

```bash
# Vercel - revenir à un déploiement précédent
vercel rollback

# Git - revenir à un commit stable
git revert HEAD
git push origin main

# Base de données - restaurer backup
pg_restore -d harp backup.sql
```

---

## Support

- Documentation: `/docs/`
- API: `/api/docs`
- Audit sécurité: `AUDIT_COMPLET_DEC_2025.md`
