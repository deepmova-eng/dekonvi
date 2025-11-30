-- =====================================================
-- TRIGGER: Synchronisation automatique des notes vendeur
-- =====================================================
-- Ce trigger met à jour profiles.rating et profiles.total_ratings
-- automatiquement quand un avis est ajouté/modifié/supprimé

-- Fonction qui recalcule la note moyenne du vendeur
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
DECLARE
  seller_uuid UUID;
BEGIN
  -- Récupérer l'ID du vendeur (NEW pour insert/update, OLD pour delete)
  seller_uuid := COALESCE(NEW.seller_id, OLD.seller_id);
  
  -- Mettre à jour la note moyenne et le nombre total d'avis
  UPDATE profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews 
      WHERE seller_id = seller_uuid
        AND status = 'approved'  -- Seulement les avis approuvés
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE seller_id = seller_uuid
        AND status = 'approved'
    )
  WHERE id = seller_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger qui s'exécute après chaque modification
DROP TRIGGER IF EXISTS sync_seller_rating ON reviews;
CREATE TRIGGER sync_seller_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_seller_rating();

-- =====================================================
-- INITIALISATION: Mettre à jour toutes les notes existantes
-- =====================================================
UPDATE profiles p
SET 
  rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM reviews r
    WHERE r.seller_id = p.id
      AND r.status = 'approved'
  ),
  total_ratings = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.seller_id = p.id
      AND r.status = 'approved'
  )
WHERE id IN (SELECT DISTINCT seller_id FROM reviews);
