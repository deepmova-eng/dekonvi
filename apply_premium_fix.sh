#!/bin/bash
# Script to apply the premium_requests UNIQUE constraint fix

echo "🔧 Applying premium_requests UNIQUE constraint fix..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    echo "Please run this migration manually via Supabase Dashboard:"
    echo "1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/editor"
    echo "2. Open SQL Editor"
    echo "3. Copy and paste the contents of:"
    echo "   supabase/migrations/20241207_fix_premium_requests_unique_constraint.sql"
    echo "4. Click RUN"
    exit 1
fi

# Apply migration
echo "Applying migration to: $DATABASE_URL"
psql "$DATABASE_URL" -f supabase/migrations/20241207_fix_premium_requests_unique_constraint.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Changes made:"
    echo "  - Removed UNIQUE(listing_id) constraint"
    echo "  - Added conditional UNIQUE index (only for pending/approved)"
    echo "  - Users can now re-submit boost requests after rejection"
else
    echo ""
    echo "❌ Migration failed"
    echo "Please apply manually via Supabase Dashboard"
    exit 1
fi
