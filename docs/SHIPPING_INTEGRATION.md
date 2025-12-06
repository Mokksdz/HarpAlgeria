# Intégration Services de Livraison

Le dashboard Harp supporte deux services de livraison algériens :
- **Yalidine** (recommandé) - API complète avec suivi détaillé
- **ZR Express (Procolis)** - Alternative simple

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Yalidine API (Recommandé)
YALIDINE_API_URL=https://api.yalidine.app/v1
YALIDINE_API_ID=82986803451220526533
YALIDINE_API_TOKEN=OEdv3fyC0q8cemUgZIBtJnNlGYbwixzPKsHDTQFo4WMhk5V9RSujL2p6Ara17X

# ZR Express API (Procolis)
ZR_EXPRESS_API_URL=https://procolis.com/api_v1
ZR_EXPRESS_TOKEN=b30091c8d5d1edb4d7ef5260b1aa23d01d29d047f0df5054c977265385086b96
ZR_EXPRESS_KEY=98eb7db732444af680f52e49df17bbdb
```

### Accéder à l'interface

1. Connectez-vous à l'admin : `/admin/login`
2. Cliquez sur **Livraison** dans le menu latéral
3. Vérifiez les indicateurs de connexion pour chaque service

## Fonctionnalités

### Créer une expédition

1. Allez dans **Livraison**
2. Trouvez une commande "À expédier"
3. Cliquez sur le bouton **Expédier** ▼
4. Choisissez **Yalidine** ou **ZR Express**
5. Le numéro de tracking sera automatiquement attribué
6. Le bordereau (étiquette) s'ouvre automatiquement (Yalidine)

### Suivre une expédition

- Cliquez sur l'icône 🔄 pour synchroniser le statut
- Cliquez sur l'icône 🔗 pour voir sur le site du transporteur
- Un badge indique le transporteur utilisé (Yalidine/ZR)

### Statuts Yalidine

| Statut Yalidine | Statut Harp |
|-----------------|-------------|
| En préparation | CONFIRMED |
| Prêt à expédier | CONFIRMED |
| Ramassé | SHIPPED |
| Expédié | SHIPPED |
| Centre | SHIPPED |
| Vers Wilaya | SHIPPED |
| Sorti en livraison | SHIPPED |
| Livré | DELIVERED |
| Retourné au vendeur | CANCELLED |

### Statuts ZR Express

| Statut ZR Express | Statut Harp |
|-------------------|-------------|
| En préparation | CONFIRMED |
| Prêt à expédier | CONFIRMED |
| Ramassé | SHIPPED |
| En transit | SHIPPED |
| En cours de livraison | SHIPPED |
| Livré | DELIVERED |
| Retourné | CANCELLED |

## API Endpoints

### GET /api/shipping
Tester la connexion et récupérer les tarifs.

### POST /api/shipping
Créer une nouvelle expédition.

```json
{
    "orderId": "clxx...",
    "orderData": {
        "customerName": "Mohamed",
        "customerPhone": "0550000000",
        "address": "Rue 39",
        "commune": "Maraval",
        "wilayaId": "31",
        "total": 5000,
        "deliveryType": "DOMICILE",
        "products": "2x Robe Hiver"
    }
}
```

### POST /api/shipping/track
Suivre des colis.

```json
{
    "trackingNumbers": ["AAA001", "AAA002"]
}
```

## Types de livraison

- `0` = Livraison à domicile
- `1` = Stop Desk (point relais)

## Tarification

Les tarifs sont récupérés automatiquement depuis l'API ZR Express selon la wilaya de destination.

## Support

- **Dashboard ZR Express** : https://procolis.com
- **Suivi colis** : https://procolis.com/suivi/{tracking}
