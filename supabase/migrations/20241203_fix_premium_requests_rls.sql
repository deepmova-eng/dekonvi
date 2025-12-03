-- ═══════════════════════════════════════════════════════════
-- DIAGNOSTIC & FIX : Demandes Premium invisibles pour Admin
-- Date: 2024-12-03
-- Objectif: Débloquer l'affichage des demandes premium dans l'admin
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 1 : DIAGNOSTIC - Vérifier les données
-- ═══════════════════════════════════════════════════════════

-- Voir toutes les demandes premium (bypass RLS pour diagnostic)
SELECT * FROM public.premium_requests;

-- Résultat attendu :
-- - Si vide → Problème frontend (bouton boost ne fonctionne pas)
-- - Si plein → Problème RLS (admin ne peut pas voir)

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 2 : VÉRIFIER LES RLS POLICIES EXISTANTES
-- ═══════════════════════════════════════════════════════════

-- Lister toutes les policies sur premium_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'premium_requests'
ORDER BY cmd, policyname;

-- Vérifier si RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'premium_requests';

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 3 : CRÉER/CORRIGER LES RLS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Activer RLS si besoin
ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Users can create premium requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Admins can view all premium requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Admins can update premium requests" ON public.premium_requests;

-- Policy INSERT : Les utilisateurs peuvent créer des demandes
CREATE POLICY "Users can create premium requests"
  ON public.premium_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy SELECT : Les utilisateurs voient leurs propres demandes
CREATE POLICY "Users can view their own requests"
  ON public.premium_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy SELECT : Les admins voient TOUT
CREATE POLICY "Admins can view all premium requests"
  ON public.premium_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy UPDATE : Seuls les admins peuvent modifier (approuver/rejeter)
CREATE POLICY "Admins can update premium requests"
  ON public.premium_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 4 : BONUS - Notifier l'admin des nouvelles demandes
-- ═══════════════════════════════════════════════════════════

-- Fonction pour notifier TOUS les admins
CREATE OR REPLACE FUNCTION public.notify_admins_new_premium_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Pour chaque admin, créer une notification
  FOR admin_record IN 
    SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, content, link, read)
      VALUES (
        admin_record.id,
        'alert',
        'Nouvelle demande Premium ! 💎',
        'Un utilisateur demande un boost. Consultez le panel admin.',
        '/admin',
        false
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la notification admin: %', SQLERRM;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur INSERT
DROP TRIGGER IF EXISTS on_new_premium_request ON public.premium_requests;
CREATE TRIGGER on_new_premium_request
  AFTER INSERT ON public.premium_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_premium_request();

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════

-- Vérifier les policies créées
SELECT 
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'premium_requests'
ORDER BY cmd, policyname;

-- Résultat attendu : 4 policies
-- - Admins can update premium requests (UPDATE)
-- - Admins can view all premium requests (SELECT)
-- - Users can create premium requests (INSERT)
-- - Users can view their own requests (SELECT)

-- Vérifier le trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'premium_requests'
AND trigger_name = 'on_new_premium_request';

-- ═══════════════════════════════════════════════════════════
-- TEST (Facultatif)
-- ═══════════════════════════════════════════════════════════

/*
-- Test 1 : Créer une demande en tant qu'utilisateur
INSERT INTO public.premium_requests (user_id, listing_id, status)
VALUES (auth.uid(), 'YOUR-LISTING-ID', 'pending');

-- Test 2 : Vérifier que l'admin la voit
-- Connectez-vous en tant qu'admin et exécutez :
SELECT * FROM public.premium_requests WHERE status = 'pending';

-- Test 3 : Vérifier la notification admin
SELECT * FROM public.notifications WHERE type = 'alert' ORDER BY created_at DESC LIMIT 5;
*/

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Les demandes premium sont maintenant visibles par l'admin ! 💎
-- ═══════════════════════════════════════════════════════════
