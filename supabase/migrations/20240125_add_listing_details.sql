-- Add shipping_available and condition columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS shipping_available BOOLEAN DEFAULT false;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS condition VARCHAR(50);

-- Add comment to columns
COMMENT ON COLUMN listings.shipping_available IS 'Whether shipping is available for this item';
COMMENT ON COLUMN listings.condition IS 'Condition of the item (neuf, comme-neuf, bon-etat, etat-correct, a-renover)';
