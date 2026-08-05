
-- Drop local password_hash column as we are moving to Supabase Auth
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
