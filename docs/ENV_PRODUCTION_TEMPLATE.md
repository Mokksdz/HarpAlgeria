# 🔐 Variables d'Environnement Production

## Template `.env.production`

Copiez ce template et renseignez les valeurs pour votre environnement de production.

```env
# =============================================================================
# HARP E-COMMERCE - PRODUCTION ENVIRONMENT
# =============================================================================

# -----------------------------------------------------------------------------
# CORE
# -----------------------------------------------------------------------------
NODE_ENV=production

# -----------------------------------------------------------------------------
# DATABASE (PostgreSQL)
# -----------------------------------------------------------------------------
DATABASE_URL="postgresql://user:password@host:5432/harp_prod?sslmode=require"

# -----------------------------------------------------------------------------
# AUTHENTICATION
# -----------------------------------------------------------------------------
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Admin credentials (use scripts/generate-admin-hash.js)
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD_HASH="$2a$10$..."

# -----------------------------------------------------------------------------
# CORS & SECURITY
# -----------------------------------------------------------------------------
ALLOWED_ORIGINS="https://your-domain.com,https://admin.your-domain.com"

# -----------------------------------------------------------------------------
# SHIPPING PROVIDERS
# -----------------------------------------------------------------------------
# Yalidine
YALIDINE_API_ID="your-api-id"
YALIDINE_API_TOKEN="your-api-token"

# ZR Express
ZR_EXPRESS_TOKEN="your-token"
ZR_EXPRESS_KEY="your-key"

# -----------------------------------------------------------------------------
# EMAIL (SMTP)
# -----------------------------------------------------------------------------
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="email@example.com"
SMTP_PASS="password"
SMTP_FROM="Harp <noreply@your-domain.com>"

# -----------------------------------------------------------------------------
# CLOUD STORAGE (Optional)
# -----------------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"

# OR S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="eu-west-3"
S3_BUCKET="harp-uploads"

# -----------------------------------------------------------------------------
# MONITORING (Optional)
# -----------------------------------------------------------------------------
SENTRY_DSN=""
LOG_LEVEL="info"

# -----------------------------------------------------------------------------
# PAYMENTS (If applicable)
# -----------------------------------------------------------------------------
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""

# -----------------------------------------------------------------------------
# ANALYTICS (Optional)
# -----------------------------------------------------------------------------
GOOGLE_ANALYTICS_ID=""
FACEBOOK_PIXEL_ID=""
```

## 🔒 Bonnes Pratiques Sécurité

1. **NE JAMAIS** commit les fichiers `.env` dans Git
2. Utiliser un **secret manager** (Vercel Secrets, AWS Secrets Manager, etc.)
3. **Rotation des secrets** tous les 90 jours minimum
4. **Audit logs** pour tout accès aux secrets

## 🔑 Génération des Secrets

### NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### ADMIN_PASSWORD_HASH
```bash
node scripts/generate-admin-hash.js "VotreMotDePasse"
```

## 📋 Checklist Variables

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | URL PostgreSQL |
| `NEXTAUTH_URL` | ✅ | URL du site |
| `NEXTAUTH_SECRET` | ✅ | Secret JWT (32+ chars) |
| `ADMIN_EMAIL` | ✅ | Email admin |
| `ADMIN_PASSWORD_HASH` | ✅ | Hash bcrypt |
| `ALLOWED_ORIGINS` | ✅ | Domaines CORS |
| `YALIDINE_*` | ⚠️ | Si livraison Yalidine |
| `ZR_EXPRESS_*` | ⚠️ | Si livraison ZR |
| `SMTP_*` | ⚠️ | Si emails transactionnels |
| `SENTRY_DSN` | ⭐ | Recommandé pour monitoring |
