# Authentification Automatique par Email (Magic Link)

Ce module permet la création de compte et la connexion sans mot de passe via un lien sécurisé envoyé par email.

## Architecture

### Modèle de données (Prisma)
- **User**: Ajout de `isEmailVerified`, `createdVia`, `guestKey`.
- **MagicLinkToken**: Stocke les tokens hachés pour éviter le replay attack.

### Services
- `src/lib/auth/auto-email.service.ts`: Gère la création d'utilisateur, l'émission et la vérification des tokens.
- `src/lib/email/magic-link.ts`: Envoi des emails (via Nodemailer/SMTP).

### API Endpoints

#### 1. Demande de lien magique
`POST /api/v3/auth/auto-create`
- **Body**: `{ "email": "user@example.com", "guestKey": "uuid..." }`
- **Rate Limit**: 5 requêtes / heure / IP.
- **Action**: Crée l'utilisateur (si inexistant) et envoie un email.

#### 2. Vérification du lien
`POST /api/v3/auth/magic-link/verify`
- **Body**: `{ "token": "jwt_token..." }`
- **Action**: Vérifie le token, le consomme, et retourne l'utilisateur.
- **Note**: Utilisé par le provider `next-auth` "Magic Link".

#### 3. Synchronisation Wishlist
`POST /api/v3/wishlist/sync`
- **Headers**: `Authorization: Bearer <session_token>` (via Cookie session)
- **Body**: `{ "items": [{ "productId": "..." }], "guestKey": "..." }`
- **Action**: Fusionne les items locaux avec le compte utilisateur.

## Variables d'environnement

Ajouter dans `.env`:

```bash
# Magic Link Security
MAGIC_LINK_JWT_SECRET="votre_secret_long_et_complexe"
MAGIC_LINK_EXP_MIN=15

# Email Provider (dev=log console, prod=smtp)
EMAIL_PROVIDER="nodemailer" 
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user"
SMTP_PASS="pass"

# Base URL
NEXTAUTH_URL="http://localhost:3000"
```

## Tests Manuels (Curl)

### 1. Demander un lien
```bash
curl -X POST http://localhost:3000/api/v3/auth/auto-create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@harp.com", "name":"Test User"}'
```
*Réponse attendue*: `{"success":true, "message":"..."}`

### 2. Vérifier le token (simulé)
Récupérez le token depuis la console (en dev) ou l'email.
```bash
curl -X POST http://localhost:3000/api/v3/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"<VOTRE_TOKEN>"}'
```

## Déploiement

1. Appliquer la migration :
   `npx prisma migrate deploy`
2. Configurer les variables d'environnement.
3. Vérifier le service SMTP.
