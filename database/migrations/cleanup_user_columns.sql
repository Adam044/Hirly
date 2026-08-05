
-- 1. Add website_link to professionals and employers
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS website_link TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS website_link TEXT;

-- 2. Migrate data
-- For professionals
UPDATE professionals p
SET website_link = u.website_link
FROM users u
WHERE p.user_id = u.id AND u.website_link IS NOT NULL;

-- For employers
UPDATE employers e
SET website_link = u.website_link
FROM users u
WHERE e.user_id = u.id AND u.website_link IS NOT NULL;

-- 3. Drop legacy columns from users
ALTER TABLE users 
    DROP COLUMN IF EXISTS monthly_profile_views_count,
    DROP COLUMN IF EXISTS tier_expiration_date,
    DROP COLUMN IF EXISTS last_profile_views_reset_date,
    DROP COLUMN IF EXISTS website_link;
