-- Add subcategory column to listings table
-- This allows hierarchical categorization: category → subcategory
-- Example: category='mode' → subcategory='vetements'

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_subcategory 
ON listings(subcategory);

-- Add composite index for category + subcategory filtering
CREATE INDEX IF NOT EXISTS idx_listings_category_subcategory 
ON listings(category, subcategory);

-- Add check constraint to prevent empty strings
ALTER TABLE listings 
ADD CONSTRAINT check_subcategory_not_empty 
CHECK (subcategory IS NULL OR length(trim(subcategory)) > 0);

-- Comment for documentation
COMMENT ON COLUMN listings.subcategory IS 'Subcategory for hierarchical filtering (e.g., vetements, chaussures for category mode)';
