-- ============================================
-- CONTRAINTES DE VALIDATION POUR LISTINGS
-- ============================================

-- 1. Contraintes sur le titre
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS title_length,
DROP CONSTRAINT IF EXISTS title_not_empty;

ALTER TABLE listings
ADD CONSTRAINT title_length CHECK (char_length(title) BETWEEN 5 AND 100),
ADD CONSTRAINT title_not_empty CHECK (title ~ '\S'); -- Au moins 1 caractère non-blanc

-- 2. Contraintes sur la description
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS description_length,
DROP CONSTRAINT IF EXISTS description_not_empty;

ALTER TABLE listings
ADD CONSTRAINT description_length CHECK (char_length(description) BETWEEN 20 AND 2000),
ADD CONSTRAINT description_not_empty CHECK (description ~ '\S');

-- 3. Contraintes sur le prix
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS price_positive,
DROP CONSTRAINT IF EXISTS price_maximum;

ALTER TABLE listings
ADD CONSTRAINT price_positive CHECK (price >= 0),
ADD CONSTRAINT price_maximum CHECK (price <= 999999999);

-- 4. Contraintes sur les images
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS images_required,
DROP CONSTRAINT IF EXISTS images_limit;

ALTER TABLE listings
ADD CONSTRAINT images_required CHECK (array_length(images, 1) >= 1),
ADD CONSTRAINT images_limit CHECK (array_length(images, 1) <= 10);

-- 5. Contraintes sur la catégorie
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS valid_category;

ALTER TABLE listings
ADD CONSTRAINT valid_category CHECK (
  category IN (
    'immobilier', 'vehicules', 'high-tech', 'maison', 'mode', 
    'loisirs', 'famille', 'animaux', 'emploi-services', 
    'materiel-pro', 'vacances', 'autres'
  )
);

-- 6. Contraintes sur le statut
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE listings
ADD CONSTRAINT valid_status CHECK (
  status IN ('active', 'pending', 'rejected', 'sold')
);

-- 7. Contraintes sur la localisation
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS location_length;

ALTER TABLE listings
ADD CONSTRAINT location_length CHECK (char_length(location) BETWEEN 2 AND 100);

-- 8. Contraintes sur la condition
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS valid_condition;

ALTER TABLE listings
ADD CONSTRAINT valid_condition CHECK (
  condition IN ('neuf', 'comme-neuf', 'bon-etat', 'etat-correct', 'a-renover')
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Vérification
SELECT 
  constraint_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'listings' 
AND constraint_type = 'CHECK'
ORDER BY constraint_name;
