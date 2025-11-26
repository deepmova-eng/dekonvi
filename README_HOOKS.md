# Standards des Hooks

Ce document liste les hooks standards à utiliser dans le projet et ceux qui sont obsolètes.

## Favoris
- ✅ `useIsFavorite(listingId)` - Vérifie si une annonce est favorite (pour les boutons coeur)
- ✅ `useToggleFavorite()` - Ajoute/retire des favoris
- ✅ `useFavoriteListings(userId)` - Récupère la liste complète des annonces favorites
- ❌ `useFavorites` - **OBSOLÈTE** (Supprimé). Ne plus utiliser.

## Messages
- ✅ `useConversations(userId)` - Liste des conversations
- ✅ `useMessages(conversationId)` - Messages d'une conversation
- ✅ `useSendMessage()` - Envoyer un message
- ✅ `useMarkMessagesAsRead()` - Marquer les messages comme lus

## Listings
- ✅ `useListings(filters)` - Liste des annonces avec filtres
- ✅ `useListing(id)` - Une annonce spécifique
- ✅ `fetchListing(id)` - Helper pour le prefetching

## Bonnes Pratiques
1. Toujours utiliser les hooks "named" (ex: `useIsFavorite`) plutôt que des hooks génériques si possible.
2. Vérifier `src/hooks/` avant de créer un nouveau hook pour éviter les doublons.
3. Les hooks de données utilisent React Query (`useQuery`) pour le cache et la gestion d'état.
