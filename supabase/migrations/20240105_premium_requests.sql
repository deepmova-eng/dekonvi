-- Table premium_requests
CREATE TABLE IF NOT EXISTS premium_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(listing_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_premium_requests_listing ON premium_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_premium_requests_status ON premium_requests(status);

-- RLS
ALTER TABLE premium_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own premium requests"
ON premium_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create premium requests"
ON premium_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins peuvent voir/modifier tout
CREATE POLICY "Admins can view all premium requests"
ON premium_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update premium requests"
ON premium_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
