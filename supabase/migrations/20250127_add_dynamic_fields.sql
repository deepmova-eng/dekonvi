-- Add dynamic_fields column to listings table
-- This column will store category-specific fields as JSON

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS dynamic_fields JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN listings.dynamic_fields IS 'Category-specific fields (brand, model, size, etc.) stored as JSON';

-- Create index for better query performance on dynamic fields
CREATE INDEX IF NOT EXISTS idx_listings_dynamic_fields ON listings USING GIN (dynamic_fields);
