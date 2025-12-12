# Configuration des Secrets GitHub pour le Cron Job

Pour que le workflow GitHub Actions fonctionne, vous devez configurer les secrets suivants :

## Étapes de Configuration

1. **Aller dans les Paramètres du Repo GitHub**
   ```
   Votre Repo → Settings → Secrets and variables → Actions
   ```

2. **Ajouter les Secrets Suivants**

   ### `SUPABASE_URL`
   - **Nom** : `SUPABASE_URL`
   - **Valeur** : L'URL de votre projet Supabase
   - **Format** : `https://xxxxxxxxxxxxxx.supabase.co`
   - **Où le trouver** : Supabase Dashboard → Project Settings → API → Project URL

   ### `SUPABASE_ANON_KEY`
   - **Nom** : `SUPABASE_ANON_KEY`
   - **Valeur** : Votre clé API publique (anon key)
   - **Format** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Où le trouver** : Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

## Test Manuel du Workflow

Une fois les secrets configurés, vous pouvez tester le workflow :

1. Aller dans **Actions** → **Expire Premium Listings (Cron)**
2. Cliquer sur **Run workflow**
3. Vérifier les logs pour confirmer le succès

## Sécurité

⚠️ **Important** :
- Utilisez TOUJOURS la clé `anon` (publique), JAMAIS la clé `service_role`
- Les secrets GitHub sont chiffrés et ne sont jamais exposés dans les logs
- Le workflow utilise `api_expire_premium_listings()` qui a ses propres protections RLS

## Vérification

Après la première exécution, vérifiez dans Supabase SQL Editor :

```sql
SELECT * FROM premium_expiration_log ORDER BY expired_at DESC LIMIT 10;
```
