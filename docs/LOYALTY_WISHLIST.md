# Documentation : Module Fidélité & Wishlist (HARP REWARDS)

Ce document décrit l'architecture, les flux et l'utilisation du module de fidélité et de wishlist pour HARP.

## 1. Architecture de la Base de Données (Prisma)

### Modèles Principaux

*   **User** : Étendu pour inclure `loyaltyPoints` (Solde actuel), `vipLevel` (Statut), et les relations vers `orders`, `wishlist`, et `pointHistory`.
*   **LoyaltyPoint** : Historique des transactions de points (Gains et Dépenses).
    *   `amount` : Positif pour les gains, négatif pour les dépenses.
    *   `reason` : Type d'action (PURCHASE, SIGNUP, REVIEW, etc.).
*   **LoyaltyReward** : Catalogue des récompenses disponibles (Coupons, Produits offerts).
*   **WishlistItem** : Table de liaison User <-> Product pour les favoris.

### Diagramme ER Simplifié

User 1 -- * LoyaltyPoint
User 1 -- * WishlistItem
WishlistItem * -- 1 Product

## 2. Logique Métier (Services)

Les services sont situés dans `src/lib/loyalty/services/`.

### Loyalty Service (`loyalty.service.ts`)

*   **earnPoints(userId, amount, reason)** : Ajoute des points, recalcule le niveau VIP, et enregistre l'historique.
*   **redeemReward(userId, rewardId)** : Vérifie le solde, déduit le coût, et enregistre la transaction.
*   **getLoyaltySummary(userId)** : Retourne le solde, le niveau VIP, la progression vers le prochain niveau, et l'historique récent.

### Règles de Points

| Action | Points | Code |
| :--- | :--- | :--- |
| Achat | 1 pt / 1 DZD | `PURCHASE` |
| Création Compte | 100 pts | `SIGNUP` |
| Anniversaire | 300 pts | `BIRTHDAY` |
| Avis avec photo | 150 pts | `REVIEW` |
| Ajout Wishlist | 10 pts | `WISHLIST_ADD` |

### Niveaux VIP

*   **SILVER** : 0 - 49,999 pts
*   **GOLD** : 50,000 - 149,999 pts (x1.2 accumulation future - à implémenter)
*   **BLACK** : 150,000+ pts (x1.5 accumulation future - à implémenter)

## 3. API Routes (Next.js App Router)

Toutes les routes sont sous `/api/v3/`.

*   `GET /api/v3/loyalty/balance` : Récupère le statut fidélité de l'utilisateur connecté.
*   `POST /api/v3/loyalty/earn` : (Admin/Interne) Attribue des points manuellement.
*   `GET /api/v3/loyalty/rewards` : Liste les récompenses actives.
*   `POST /api/v3/loyalty/redeem` : Échange des points contre une récompense.
*   `GET /api/v3/wishlist` : Récupère la wishlist de l'utilisateur.
*   `POST /api/v3/wishlist/toggle` : Ajoute/Retire un produit de la wishlist.
*   `POST /api/v3/wishlist/sync` : Synchronise la wishlist locale (localStorage) après connexion.

## 4. Intégration Frontend

### Pages
*   `/loyalty` : Dashboard complet (Statut, Jauge de progression, Historique, Boutique cadeaux).
*   `/wishlist` : Grille des produits favoris avec ajout rapide au panier.

### Composants
*   `<WishlistButton productId="..." />` : Bouton cœur universel. Gère l'état local (si non connecté) et API (si connecté).
*   `<LoyaltyDashboard />` : Composant principal de la page fidélité.

## 5. Guide d'Utilisation & Tests

### Scénario 1 : Ajout à la Wishlist
1.  Utilisateur clique sur le cœur d'un produit.
2.  Si non connecté -> Sauvegarde dans `localStorage`.
3.  Si connecté -> Appel API `/api/v3/wishlist/toggle`.
4.  Backend ajoute le lien et crédite +10 points (limité).

### Scénario 2 : Achat (Futur)
1.  Lors de la validation de commande (Webhook ou Service Payment).
2.  Appeler `earnPoints(userId, totalAmount, "PURCHASE")`.

### Scénario 3 : Débloquer une récompense
1.  Sur `/loyalty`, utilisateur clique sur une récompense.
2.  Vérification solde client-side + server-side.
3.  Déduction des points.
4.  (À faire) Génération d'un code promo ou ajout du produit au panier.

## 6. Améliorations Futures (Roadmap)

1.  **Intégration Checkout** : Permettre l'application directe des récompenses (ex: Livraison gratuite) dans le tunnel de commande.
2.  **Emailing** : Envoyer un mail lors du changement de niveau VIP.
3.  **Expiration** : Mettre en place un cron job pour expirer les points après 12 mois d'inactivité.
4.  **Parrainage** : Générer des codes de parrainage uniques liés au `userId`.
