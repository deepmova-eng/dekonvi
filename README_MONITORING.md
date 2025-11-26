# Guide de Monitoring

## Sentry (Erreurs)

Dashboard : https://sentry.io/organizations/your-org/projects/dekonvi/

### Alerts configurées :
- Erreurs critiques → Email immédiat
- >10 erreurs/5min → Email + Slack

### Comment voir les erreurs :
1. Aller sur Sentry
2. Onglet "Issues"
3. Filtrer par environnement/date

## Plausible (Analytics)

Dashboard : https://plausible.io/dekonvi.com

### Métriques suivies :
- Pages vues
- Visiteurs uniques
- Sources de trafic
- Conversions (signups, listings créés, etc.)

## Web Vitals

Loggés dans Sentry sous "Performance"

### Objectifs :
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

## Debugging en Production

Ctrl+Shift+D → Ouvre React Query Devtools

## Variables d'environnement requises

```env
VITE_SENTRY_DSN=...
VITE_SENTRY_ENVIRONMENT=production
VITE_PLAUSIBLE_DOMAIN=dekonvi.com
SENTRY_AUTH_TOKEN=... (pour les source maps)
```
