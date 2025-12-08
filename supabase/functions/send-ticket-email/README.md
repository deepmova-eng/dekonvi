# Ticket Email Notifications - Setup Guide

## 📧 Email notifications pour le système de ticketing

Cette Edge Function envoie des emails pour :
1. **Nouveau ticket** → Email aux admins
2. **Réponse admin** → Email au user

---

## 🚀 Déploiement

### 1. Installer Supabase CLI (si pas déjà fait)

```bash
brew install supabase/tap/supabase
```

### 2. Login Supabase

```bash
supabase login
```

### 3. Link projet

```bash
cd /Users/khaljay/Downloads/project
supabase link --project-ref fcnnlfestkyytrjtgj
```

### 4. Configurer secrets

```bash
# Resend API Key
supabase secrets set RESEND_API_KEY=re_xxxxx

# Supabase URL
supabase secrets set SUPABASE_URL=https://fcnnlfestkyytrjtgj.supabase.co

# Service Role Key (depuis Supabase Dashboard > Settings > API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 5. Déployer la fonction

```bash
supabase functions deploy send-ticket-email
```

---

## 🔗 Intégration dans l'app

### Modifier `useSupport.ts`

Après le créer de ticket et l'envoi de message admin, appeler la fonction :

```typescript
// Dans useCreateTicket onSuccess
const { data: { session } } = await supabase.auth.getSession();
await supabase.functions.invoke('send-ticket-email', {
  body: {
    type: 'new_ticket',
    ticketId: data.id
  },
  headers: {
    Authorization: `Bearer ${session?.access_token}`
  }
});

// Dans useSendMessage onSuccess (si sender est admin)
if (isAdmin) {
  await supabase.functions.invoke('send-ticket-email', {
    body: {
      type: 'admin_reply',
      ticketId: data.ticket_id,
      messageId: data.id
    }
  });
}
```

---

## 📬 Templates

### Email 1 : Nouveau ticket (→ Admins)

**Subject** : `[Nouveau Ticket #ABC123] 🔒 Problème de validation`

**Design** :
- Header bleu/violet gradient
- Info ticket (user, sujet, message)
- Bouton CTA "Répondre au ticket"
- Footer Dekonvi

### Email 2 : Réponse admin (→ User)

**Subject** : `[Ticket #ABC123] Notre équipe vous a répondu`

**Design** :
- Header vert/bleu gradient
- Message admin dans box bleu
- Bouton CTA "Voir la conversation"
- Astuce : lien vers historique tickets

---

## ✅ Test

### Test 1 : Nouveau ticket

```bash
curl -X POST \
  https://fcnnlfestkyytrjtgj.supabase.co/functions/v1/send-ticket-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "new_ticket",
    "ticketId": "TICKET_ID_HERE"
  }'
```

### Test 2 : Réponse admin

```bash
curl -X POST \
  https://fcnnlfestkyytrjtgj.supabase.co/functions/v1/send-ticket-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "admin_reply",
    "ticketId": "TICKET_ID_HERE",
    "messageId": "MESSAGE_ID_HERE"
  }'
```

---

## 🔐 Sécurité

**RLS Bypass** : La fonction utilise `SUPABASE_SERVICE_ROLE_KEY` pour bypasser RLS et fetch les données nécessaires.

**Validation** : 
- Vérifie que ticket existe
- Vérifie que message est bien d'un admin
- Vérifie que admins existent en DB

---

## 📊 Monitoring

Logs functions :
```bash
supabase functions logs send-ticket-email
```

Ou dans Dashboard → Edge Functions → send-ticket-email → Logs

---

## ✨ Améliorations futures

- [ ] Template customizable dans DB
- [ ] Retry logic si email échoue
- [ ] Tracking email ouverture (Resend webhooks)
- [ ] Digest emails (résumé quotidien admins)
- [ ] Email preferences user (opt-out)
