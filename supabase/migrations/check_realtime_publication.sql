-- Vérifier si la table messages est dans la publication Realtime
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'messages';

-- Si vide, ajouter manuellement :
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
