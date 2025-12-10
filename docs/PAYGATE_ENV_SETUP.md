# 🔐 Configuration Supabase - PayGate Integration

## Variables d'Environnement Requises

Ces variables doivent être configurées dans **Supabase Dashboard → Settings → Edge Functions → Secrets**

### PayGate API Configuration

```bash
# PayGate API Key (CRITICAL - NEVER share publicly)
PAYGATE_API_KEY=2e902674-25e8-432b-98de-362ed4381ff4

# PayGate API Base URL
PAYGATE_API_URL=https://api.paygateglobal.com/v1

# PayGate Webhook Secret (à générer pour sécurité)
PAYGATE_WEBHOOK_SECRET=[GENERER_UN_SECRET_FORT]
```

## Comment Configurer

### 1. Accéder aux Settings Supabase

1. Aller sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet Dekonvi
3. Settings → Edge Functions → Secrets

### 2. Ajouter chaque variable

Pour chaque variable ci-dessus :
- Cliquer sur "Add Secret"
- Name : `PAYGATE_API_KEY`
- Value : `2e902674-25e8-432b-98de-362ed4381ff4`
- Cliquer "Save"

### 3. Générer le Webhook Secret

```bash
# Générer un secret aléatoire fort
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier le résultat et l'ajouter comme `PAYGATE_WEBHOOK_SECRET`

## Vérification

Une fois les variables ajoutées, vérifier qu'elles sont bien configurées :

```bash
# Dans Supabase CLI
supabase secrets list
```

Devrait afficher :
```
PAYGATE_API_KEY
PAYGATE_API_URL
PAYGATE_WEBHOOK_SECRET
```

## ⚠️ SÉCURITÉ

> [!CAUTION]
> **NE JAMAIS** commiter ces variables dans Git
> **NE JAMAIS** les utiliser dans le code frontend
> **TOUJOURS** les stocker dans les Secrets Supabase

---

## 📝 Notes

- Les Edge Functions auront automatiquement accès à ces variables via `Deno.env.get()`
- Aucune modification de code nécessaire après configuration
- Les variables sont chiffrées par Supabase
