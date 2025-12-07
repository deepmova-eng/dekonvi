# Script de Test : Envoyer Email de Validation

Ce script permet de tester l'envoi d'email manuellement via l'Edge Function.

## Prérequis

1. Edge Function déployée sur Supabase
2. Token d'authentification admin valide

## Configuration

Remplacer les valeurs suivantes :
- `YOUR_SUPABASE_URL` : URL de votre projet
- `YOUR_ACCESS_TOKEN` : Token obtenu via Supabase Dashboard ou connection admin

## Commande cURL

```bash
curl -i --location --request POST 'YOUR_SUPABASE_URL/functions/v1/send-validation-email' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"test-user-id","userName":"Test User","userEmail":"test@example.com"}'
```

## Exemple avec variables

```bash
SUPABASE_URL="https://your-project.supabase.co"
ACCESS_TOKEN="your-admin-token"
USER_EMAIL="user@example.com"
USER_NAME="John Doe"

curl -i --location --request POST "${SUPABASE_URL}/functions/v1/send-validation-email" \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data "{\"userId\":\"test-id\",\"userName\":\"${USER_NAME}\",\"userEmail\":\"${USER_EMAIL}\"}"
```

## Réponse attendue

### Succès (200)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": { ... }
}
```

### Erreur (500)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Débogage

Vérifier les logs Supabase :
```bash
supabase functions logs send-validation-email
```
