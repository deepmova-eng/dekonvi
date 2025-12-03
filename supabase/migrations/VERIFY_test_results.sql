-- Vérification rapide : Afficher les notifications de test créées

SELECT 
  type,
  title,
  LEFT(content, 50) as content_preview,
  link,
  read,
  created_at
FROM public.notifications
WHERE content LIKE '%TEST_%' OR link LIKE '%TEST_%'
ORDER BY created_at DESC
LIMIT 20;

-- Si vous voyez des résultats ici, LES TESTS ONT RÉUSSI ! ✅
